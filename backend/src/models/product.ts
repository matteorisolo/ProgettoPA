import { DataTypes, Model, Optional } from 'sequelize';
import Database from '../utils/database';
import { ProductType } from '../enums/ProductType';
import { FormatType } from '../enums/FormatType';

// Get the singleton Sequelize instance
const sequelize = Database.getInstance();

// Define the Product model attributes
export interface IProductAttributes {
    idProduct: number;
    title: string;
    type: ProductType;
    year: number;
    format: FormatType;
    cost: number;
    path: string;
}

// Define creation attributes, making idProduct optional for creation (idProduct is auto-incremented)
export interface IProductCreationAttributes extends Optional<IProductAttributes, 'idProduct'> {}

// Define the Product model class
class Product extends Model<IProductAttributes, IProductCreationAttributes> implements IProductAttributes {
    public idProduct!: number;
    public title!: string;
    public type!: ProductType;
    public year!: number;
    public format!: FormatType;
    public cost!: number;
    public path!: string;
}

// Initialize the Product sequelize model with its attributes and options
Product.init(
    {
        idProduct: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'id_product',
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        type: {
            type: DataTypes.ENUM(...Object.values(ProductType)),
            allowNull: false,
        },
        year: {
            type: DataTypes.INTEGER,
            allowNull: false,
        },
        format: {
            type: DataTypes.STRING(10),
            allowNull: false,
        },
        cost: {
            type: DataTypes.FLOAT,
            allowNull: false,
        },
        path: {
            type: DataTypes.STRING,
            allowNull: false,
        },
    },
    {
        sequelize,
        tableName: 'products',
        timestamps: false,
    }
);

// Export the Product model
export default Product;