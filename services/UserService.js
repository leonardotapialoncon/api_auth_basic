import db from '../dist/db/models/index.js';
import bcrypt from 'bcrypt';
import { Op } from 'sequelize';

const createUser = async (req) => {
    const {
        name,
        email,
        password,
        password_second,
        cellphone
    } = req.body;
    if (password !== password_second) {
        return {
            code: 400,
            message: 'Passwords do not match'
        };
    }
    const user = await db.User.findOne({
        where: {
            email: email
        }
    });
    if (user) {
        return {
            code: 400,
            message: 'User already exists'
        };
    }

    const encryptedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.User.create({
        name,
        email,
        password: encryptedPassword,
        cellphone,
        status: true
    });
    return {
        code: 200,
        message: 'User created successfully with ID: ' + newUser.id,
    }
};

const getUserById = async (id) => {
    return {
        code: 200,
        message: await db.User.findOne({
            where: {
                id: id,
                status: true,
            }
        })
    };
}

const updateUser = async (req) => {
    const user = await db.User.findOne({
        where: {
            id: req.params.id,
            status: true,
        }
    });
    const payload = {};
    payload.name = req.body.name ?? user.name;
    payload.password = req.body.password ? await bcrypt.hash(req.body.password, 10) : user.password;
    payload.cellphone = req.body.cellphone ?? user.cellphone;
    await db.User.update(payload, {
        where: {
            id: req.params.id
        }

    });
    return {
        code: 200,
        message: 'User updated successfully'
    };
}

const deleteUser = async (id) => {
    const user = await db.User.findOne({
        where: {
            id: id,
            status: true,
        }
    });
    await db.User.update({
        status: false
    }, {
        where: {
            id: id
        }
    });
    return {
        code: 200,
        message: 'User deleted successfully'
    };
}

// Nuevas funciones agregadas

const getAllUsers = async () => {
    try {
        const users = await db.User.findAll({ where: { status: true } });
        return { code: 200, message: users };
    } catch (error) {
        return { code: 500, message: error.message };
    }
};

const findUsers = async (query) => {
    const { deleted, name, lastLoginBefore, lastLoginAfter } = query;
    const whereClause = {};

    if (deleted !== undefined) whereClause.status = deleted !== 'true';
    if (name) whereClause.name = { [Op.like]: `%${name}%` };
    if (lastLoginBefore) whereClause.lastLogin = { [Op.lt]: new Date(lastLoginBefore) };
    if (lastLoginAfter) whereClause.lastLogin = { [Op.gt]: new Date(lastLoginAfter) };

    try {
        const users = await db.User.findAll({ where: whereClause });
        return { code: 200, message: users };
    } catch (error) {
        return { code: 500, message: error.message };
    }
};

const bulkCreateUsers = async (users) => {
    const results = { success: 0, failure: 0, errors: [] };
    for (const user of users) {
        try {
            await db.User.create(user);
            results.success += 1;
        } catch (error) {
            results.failure += 1;
            results.errors.push({ user, error: error.message });
        }
    }
    return { code: 200, message: results };
};

export default {
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    getAllUsers,
    findUsers,
    bulkCreateUsers,
};
