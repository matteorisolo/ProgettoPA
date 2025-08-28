import { DataTypes, Model, Optional } from 'sequelize';
import Database from '../utils/database';
import { UserRole } from '../enums/UserRole';

// Get the singleton Sequelize instance
const sequelize = Database.getInstance();

// Define the User model attributes
export interface IUserAttributes {
    idUser: number;
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role: UserRole; 
    tokens: number;
}

// Define creation attributes, making idUser and tokens optional for creation (idUser is auto-incremented, tokens has a default value)
export interface IUserCreationAttributes extends Optional<IUserAttributes, 'idUser' | 'tokens'> {}

// Define the User model class
class User extends Model<IUserAttributes, IUserCreationAttributes> implements IUserAttributes {
    public idUser!: number;
    public firstName!: string;
    public lastName!: string;
    public email!: string;
    public password!: string;
    public role!: UserRole;
    public tokens!: number;

    // Helper method to check if the user is an admin
    public isAdmin(): boolean {
        return this.role === UserRole.ADMIN;
    }
}

// Initialize the User sequelize model with its attributes and options
User.init(
    {
        idUser: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            field: 'id_user',
        },
        firstName: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'first_name',
        },
        lastName: {
            type: DataTypes.STRING,
            allowNull: true,
            field: 'last_name',
        },
        email: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        role: {
            type: DataTypes.ENUM(...Object.values(UserRole)),
            allowNull: false,
        },
        tokens: {
            type: DataTypes.INTEGER,
            allowNull: false,
            // Default value for tokens is set to 20
            defaultValue: 20,
        },
    },
    {
        sequelize,
        tableName: 'users',
        timestamps: false,
    }
);

// Export the User model
export default User;