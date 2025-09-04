import { DataTypes, Model, Optional } from 'sequelize';
import Database from '../utils/database';

// Get the singleton Sequelize instance
const sequelize = Database.getInstance();

// Define the Download model attributes
export interface IDownloadAttributes {
    idDownload: number;
    purchaseId: number;
    downloadUrl: string;
    timesUsed: number;
    maxTimes: number;
    expiresAt?: Date | null;
    createdAt: Date;
}

// Define creation attributes, making idDownload, timesUsed, expiresAt, and createdAt optional for creation (idDownload is auto-incremented, timesUsed has a default value, expiresAt is optional, createdAt has a default value)
export interface IDownloadCreationAttributes extends Optional<IDownloadAttributes, 'idDownload' | 'downloadUrl' | 'timesUsed' | 'expiresAt' | 'createdAt'> {}

class Download extends Model<IDownloadAttributes, IDownloadCreationAttributes> implements IDownloadAttributes {
    public idDownload!: number;
    public purchaseId!: number;
    public downloadUrl!: string;
    public timesUsed!: number;
    public maxTimes!: number;
    public expiresAt?: Date | null;
    public createdAt!: Date;
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
        timesUsed: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0,
            field: 'times_used',
        },
        maxTimes: {
            type: DataTypes.INTEGER,
            allowNull: false,
            field: 'max_times',
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
    },
    {
        sequelize,
        tableName: 'download',
        timestamps: false,
    }
);

// Export the Download model
export default Download;