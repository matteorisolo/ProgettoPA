import { DataTypes, Model, Optional } from 'sequelize';
import Database from '../utils/database';

// Get the singleton Sequelize instance
const sequelize = Database.getInstance();

// Define the Download model attributes
export interface IDownloadAttributes {
    idDownload: number;
    purchaseId: number;
    downloadUrl: string;
    usedBuyer: boolean;
    usedRecipient?: boolean;
    expiresAt?: Date | null;
    createdAt: Date;
    isBundle: boolean;
}

// Define creation attributes, making idDownload, timesUsed, expiresAt, and createdAt optional for creation (idDownload is auto-incremented, usedBuyer has a default value,
// userRecipient is optional, expiresAt is optional, createdAt has a default value, isBundle has a default value)
export interface IDownloadCreationAttributes
    extends Optional<
        IDownloadAttributes,
        | 'idDownload'
        | 'downloadUrl'
        | 'usedBuyer'
        | 'usedRecipient'
        | 'expiresAt'
        | 'createdAt'
        | 'isBundle'
    > {}

class Download
    extends Model<IDownloadAttributes, IDownloadCreationAttributes>
    implements IDownloadAttributes
{
    public idDownload!: number;
    public purchaseId!: number;
    public downloadUrl!: string;
    public usedBuyer!: boolean;
    public usedRecipient?: boolean;
    public expiresAt?: Date | null;
    public createdAt!: Date;
    public isBundle!: boolean;
}

// Initialize the Download sequelize model with its attributes and options
Download.init(
    {
        idDownload: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'id_download',
        },
        purchaseId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'purchase_id',
        },
        downloadUrl: {
            type: DataTypes.UUID,
            allowNull: false,
            defaultValue: DataTypes.UUIDV4,
            field: 'download_url',
        },
        usedBuyer: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'used_buyer',
        },
        usedRecipient: {
            type: DataTypes.BOOLEAN,
            allowNull: true,
            field: 'used_recipient',
        },
        expiresAt: {
            type: DataTypes.DATE,
            allowNull: true,
            field: 'expires_at',
        },
        createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: DataTypes.NOW,
            field: 'created_at',
        },
        isBundle: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false,
            field: 'is_bundle',
        },
    },
    {
        sequelize,
        tableName: 'download',
        timestamps: false,
    },
);

// Export the Download model
export default Download;
