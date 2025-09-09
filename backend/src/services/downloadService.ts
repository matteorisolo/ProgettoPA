import { Transaction } from 'sequelize';
import { IDownloadCreationAttributes } from '../models/download';
import downloadDao from '../dao/downloadDao';
import { HttpErrorFactory } from '../utils/errors/HttpErrorFactory';
import { HttpErrorCodes } from '../utils/errors/HttpErrorCodes';
import Download from '../models/download';
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import Database from '../utils/database';
import downloadRepository from '../repositories/downloadRepository';
import productDao from '../dao/productDao';
import { FormatType } from '../enums/FormatType';
import purchaseDao from '../dao/purchaseDao';
import archiver from 'archiver';

// Imagemagick for image processing
const im = require('imagemagick');
const convertAsync = promisify(im.convert);
const identifyAsync = promisify(im.identify);

// FFMPEG for video processing
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath as string);

// Interface for the output of created download
export interface ICreatedDownloadOutput {
    idDownload: number;
    downloadUrl: string;
}

// Temporary directory for watermarked files
const TMP_DIR = process.env.TMP_DIR || '/usr/src/app/tmp';
if (!fs.existsSync(TMP_DIR)) fs.mkdirSync(TMP_DIR, { recursive: true });

function clamp(n: number, min: number, max: number) {
    return Math.max(min, Math.min(max, n));
}

// Utility to check if format is an image
function isImage(f: FormatType) {
    return (
        f === FormatType.JPG || f === FormatType.PNG || f === FormatType.TIFF
    );
}

// Utility to check if format is a video
function isVideo(f: FormatType) {
    return f === FormatType.MP4;
}

// Utility to get MIME type from format
function mimeFromFormat(f: FormatType): string {
    switch (f) {
        case FormatType.JPG:
            return 'image/jpeg';
        case FormatType.PNG:
            return 'image/png';
        case FormatType.TIFF:
            return 'image/tiff';
        case FormatType.MP4:
            return 'video/mp4';
        default:
            return 'application/octet-stream';
    }
}

// Build temporary filename
function buildTmpName(base: string, ext: string): string {
    return path.join(TMP_DIR, `${base}-${Date.now()}.${ext}`);
}

// Sanitize watermark text
function safeWatermarkText(raw?: string): string {
    const def = process.env.WATERMARK_TEXT || 'DIGITAL PRODUCT';
    const s = (raw ?? def).trim();
    return s.replace(/:/g, '\\:').replace(/'/g, "\\'").replace(/"/g, '\\"');
}

/**
 * Apply watermark and optional conversion to an image.
 *
 * @param inputPath - The path to the original image file.
 * @param originalFmt - The original format of the image.
 * @param requested - The requested format (or null to keep original).
 * @param watermarkRawText - The text to apply as a watermark.
 * @returns {Promise<{ filePath: string; fileName: string; contentType: string }>} - The processed image file details.
 */
async function watermarkAndMaybeConvertImage(
    inputPath: string,
    originalFmt: FormatType,
    requested: FormatType | null,
    watermarkRawText: string,
): Promise<{ filePath: string; fileName: string; contentType: string }> {
    const outFmt: FormatType = requested ?? originalFmt;
    if (!isImage(outFmt)) {
        throw HttpErrorFactory.createError(
            HttpErrorCodes.BadRequest,
            `Unsupported image format: ${requested}`,
        );
    }
    const fontPath =
        process.env.IM_FONT_PATH ||
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';
    const watermarkText = safeWatermarkText(watermarkRawText);
    const base = path.basename(inputPath, path.extname(inputPath));
    const outPath = buildTmpName(base + '-wm', outFmt);

    const meta: any = await identifyAsync(inputPath);
    const width: number = Number(meta.width);
    const height: number = Number(meta.height);

    const scale = Number(process.env.WM_SCALE ?? '0.08');
    const minPt = Number(process.env.WM_MIN_PT ?? '32');
    const maxPt = Number(process.env.WM_MAX_PT ?? '180');
    const pointSize = clamp(
        Math.round(Math.min(width, height) * scale),
        minPt,
        maxPt,
    );

    const args = [
        inputPath,
        '(',
        '-background',
        'none',
        '-fill',
        '#FFFFFF',
        '-stroke',
        '#000000',
        '-strokewidth',
        '2',
        '-font',
        fontPath,
        '-pointsize',
        String(pointSize),
        `label:${watermarkText}`,
        ')',
        '-gravity',
        'center',
        '-compose',
        'over',
        '-composite',
        outPath,
    ];
    await convertAsync(args);

    return {
        filePath: outPath,
        fileName: path.basename(outPath),
        contentType: mimeFromFormat(outFmt),
    };
}

/**
 * Apply watermark to a video (MP4).
 *
 * @param inputPath - The path to the original video file.
 * @param watermarkRawText - The text to apply as a watermark.
 * @returns {Promise<{ filePath: string; fileName: string; contentType: string }>} - The processed video file details.
 */
async function watermarkVideoMp4(
    inputPath: string,
    watermarkRawText: string,
): Promise<{ filePath: string; fileName: string; contentType: string }> {
    const base = path.basename(inputPath, path.extname(inputPath));
    const outPath = buildTmpName(base + '-wm', FormatType.MP4);

    const text = safeWatermarkText(watermarkRawText);
    const fontPath =
        process.env.FFMPEG_FONT_PATH ||
        '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

    const videoScale = 0.06;
    const fontsizeExpr = `h*${videoScale}`;

    await new Promise<void>((resolve, reject) => {
        ffmpeg(inputPath)
            .videoFilters([
                {
                    filter: 'drawtext',
                    options: {
                        fontfile: fontPath,
                        text,
                        fontsize: fontsizeExpr,
                        fontcolor: 'white',
                        box: 1,
                        boxcolor: 'black@0.5',
                        boxborderw: 10,
                        x: '(w-text_w)/2',
                        y: '(h-text_h)/2',
                    },
                },
            ])
            .outputOptions(['-movflags', 'faststart'])
            .on('error', reject)
            .on('end', () => resolve())
            .save(outPath);
    });

    return {
        filePath: outPath,
        fileName: path.basename(outPath),
        contentType: mimeFromFormat(FormatType.MP4),
    };
}

// Interface for the prepared download file
export interface IPreparedDownloadFile {
    filePath: string;
    fileName: string;
    contentType: string;
}

export class DownloadService {
    /**
     * Function to create a new download entry.
     *
     * @param input - The attributes required to create the download.
     * @param opts - Optional Sequelize transaction configuration.
     * @returns {Promise<ICreatedDownloadOutput>} - The created download information.
     */
    static async createDownload(
        input: IDownloadCreationAttributes,
        opts?: { transaction?: Transaction },
    ): Promise<ICreatedDownloadOutput> {
        const created: Download = await downloadDao.create(input, {
            transaction: opts?.transaction,
        });

        return {
            idDownload: created.idDownload,
            downloadUrl: created.downloadUrl,
        };
    }

    /**
     * Function to process a download request:
     * validate, watermark, update usage, and return the prepared file.
     *
     * @param downloadUrl - The URL of the download.
     * @param isBuyer - Whether the requester is the buyer (true) or recipient (false).
     * @param format - The requested format (optional).
     * @returns {Promise<IPreparedDownloadFile>} - The prepared file details.
     */
    static async processDownload(
        downloadUrl: string,
        isBuyer: boolean,
        format?: FormatType,
    ): Promise<IPreparedDownloadFile> {
        const downloads = await downloadRepository.getAllByUrl(downloadUrl);
        if (!downloads || downloads.length === 0) {
            throw HttpErrorFactory.createError(
                HttpErrorCodes.NotFound,
                `Download not found for url ${downloadUrl}.`,
            );
        }

        const requestedFmt = format ?? null;
        const wmRaw = process.env.WATERMARK_TEXT || 'DIGITAL PRODUCTS - Univpm';

        let tmpPath;
        let fileName;
        let contentType;

        const isBundle = downloads[0].isBundle;

        if (!isBundle) {
            const dl = downloads[0];
            const purchase = await purchaseDao.getById(dl.purchaseId);
            const product = await productDao.getById(purchase.productId);

            const originalPath: string = product.path;
            const originalFmt: FormatType = product.format;

            if (!originalPath || !fs.existsSync(originalPath)) {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.InternalServerError,
                    'Original product file is missing on server.',
                );
            }

            if (isImage(originalFmt)) {
                if (requestedFmt && !isImage(requestedFmt)) {
                    throw HttpErrorFactory.createError(
                        HttpErrorCodes.BadRequest,
                        `Requested format '${requestedFmt}' is not valid for images.`,
                    );
                }
                const out = await watermarkAndMaybeConvertImage(
                    originalPath,
                    originalFmt,
                    requestedFmt,
                    wmRaw,
                );
                tmpPath = out.filePath;
                fileName = out.fileName;
                contentType = out.contentType;
            } else if (isVideo(originalFmt)) {
                if (requestedFmt && requestedFmt !== originalFmt) {
                    throw HttpErrorFactory.createError(
                        HttpErrorCodes.BadRequest,
                        'Changing video format is not supported.',
                    );
                }
                const out = await watermarkVideoMp4(originalPath, wmRaw);
                tmpPath = out.filePath;
                fileName = out.fileName;
                contentType = out.contentType;
            } else {
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.BadRequest,
                    'Unsupported product type.',
                );
            }

            //Consume one download use
            const sequelize = Database.getInstance();
            try {
                await sequelize.transaction(async (t: Transaction) => {
                    if (isBuyer) {
                        await downloadRepository.setUsedBuyerByUrl(
                            downloadUrl,
                            { transaction: t },
                        );
                    } else {
                        await downloadRepository.setUsedRecipientByUrl(
                            downloadUrl,
                            { transaction: t },
                        );
                    }
                });
            } catch (err) {
                if (tmpPath && fs.existsSync(tmpPath))
                    fs.unlink(tmpPath, () => {});
                throw HttpErrorFactory.createError(
                    HttpErrorCodes.InternalServerError,
                    err instanceof Error
                        ? err.message
                        : 'Failed to register download usage.',
                );
            }
            return {
                filePath: tmpPath,
                fileName: fileName,
                contentType,
            };
        } else {
            // Handle bundles (ZIP creation)
            const tmpZipPath = path.join(TMP_DIR, `bundle-${Date.now()}.zip`);
            const output = fs.createWriteStream(tmpZipPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            archive.pipe(output);
            // Array to keep track of all temporary files for cleanu
            const tmpFiles: string[] = [];

            // Iterate over each download in the bundle
            for (const dl of downloads) {
                const purchase = await purchaseDao.getById(dl.purchaseId);
                const product = await productDao.getById(purchase.productId);
                const originalPath: string = product.path;
                const originalFmt: FormatType = product.format;

                // Ensure the original file exists
                if (!originalPath || !fs.existsSync(originalPath)) {
                    throw HttpErrorFactory.createError(
                        HttpErrorCodes.InternalServerError,
                        'Original product file is missing on server.',
                    );
                }

                let tmpFile: {
                    filePath: string;
                    fileName: string;
                    contentType: string;
                };

                if (isImage(originalFmt)) {
                    tmpFile = await watermarkAndMaybeConvertImage(
                        originalPath,
                        originalFmt,
                        format ?? null,
                        process.env.WATERMARK_TEXT ||
                            'DIGITAL PRODUCTS - Univpm',
                    );
                } else if (isVideo(originalFmt)) {
                    tmpFile = await watermarkVideoMp4(
                        originalPath,
                        process.env.WATERMARK_TEXT ||
                            'DIGITAL PRODUCTS - Univpm',
                    );
                } else {
                    throw HttpErrorFactory.createError(
                        HttpErrorCodes.BadRequest,
                        'Unsupported product type in bundle.',
                    );
                }

                // Add the temporary file to the ZIP archive
                archive.file(tmpFile.filePath, { name: tmpFile.fileName });
                // Add the temporary file path to the array for cleanup later
                tmpFiles.push(tmpFile.filePath);
            }

            // Finalize the ZIP archive
            await archive.finalize();

            // Register download usage for all items in the bundle
            const sequelize = Database.getInstance();
            await sequelize.transaction(async (t) => {
                if (isBuyer) {
                    await downloadRepository.setUsedBuyerByUrl(downloadUrl, {
                        transaction: t,
                    });
                } else {
                    await downloadRepository.setUsedRecipientByUrl(
                        downloadUrl,
                        {
                            transaction: t,
                        },
                    );
                }
            });

            // Cleanup: delete all temporary files created during watermarking
            for (const f of tmpFiles) {
                if (fs.existsSync(f)) fs.unlink(f, () => {});
            }

            return {
                filePath: tmpZipPath,
                fileName: 'bundle.zip',
                contentType: 'application/zip',
            };
        }
    }
}

export default DownloadService;
