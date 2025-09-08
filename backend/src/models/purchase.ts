import { DataTypes, Model, Optional } from 'sequelize';
import Database from '../utils/database';
import { PurchaseType } from '../enums/PurchaseType';

// Get the singleton Sequelize instance
const sequelize = Database.getInstance();

// Define the Purchase model attributes
export interface IPurchaseAttributes {
  idPurchase: number;
  buyerId: number;
  recipientId?: number | null;
  recipientEmail?: string | null;
  productId: number;
  type: PurchaseType;
  createdAt: Date;
}

// Define creation attributes, making idPurchase, recipientId, recipientEmail, status, and createdAt optional for creation (idPurchase is auto-incremented, status and createdAt have default values)
export interface IPurchaseCreationAttributes
  extends Optional<
    IPurchaseAttributes,
    'idPurchase' | 'recipientId' | 'recipientEmail' | 'createdAt'
  > {}

// Define the Purchase model class
class Purchase
  extends Model<IPurchaseAttributes, IPurchaseCreationAttributes>
  implements IPurchaseAttributes
{
  public idPurchase!: number;
  public buyerId!: number;
  public recipientId?: number | null;
  public recipientEmail?: string | null;
  public productId!: number;
  public type!: PurchaseType;
  public createdAt!: Date;

  // Helper method to check if the purchase is a gift
  public isGift(): boolean {
    return this.type === PurchaseType.GIFT;
  }
}

// Initialize the Purchase sequelize model with its attributes and options
Purchase.init(
  {
    idPurchase: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id_purchase',
    },
    buyerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'buyer_id',
    },
    recipientId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'recipient_id',
    },
    recipientEmail: {
      type: DataTypes.STRING,
      allowNull: true,
      field: 'recipient_email',
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'product_id',
    },
    type: {
      type: DataTypes.ENUM(...Object.values(PurchaseType)),
      allowNull: false,
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
    tableName: 'purchase',
    timestamps: false,
  },
);

// Export the Purchase model
export default Purchase;
