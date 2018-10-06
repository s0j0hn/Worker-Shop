"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const bcrypt = require("bcryptjs");
const mongoose_1 = require("mongoose");
const validateUsername = (username) => {
    const usernameRegex = /^(?=[\w.-]+$)(?!.*[._-]{2})(?!\.)(?!.*\.$).{3,34}$/;
    return (username && usernameRegex.test(username));
};
const customerSchema = new mongoose_1.Schema({
    name: {
        type: String,
        required: 'Name must be provided.',
        index: {
            unique: true,
            sparse: true,
        },
        trim: true,
        validate: [validateUsername, 'Please enter a valid username: 3+ characters long, non restricted word, characters ' +
                '"_-.", no consecutive dots, does not begin or end with dots, letters a-z and numbers 0-9.'],
    },
    roles: {
        type: [{
                type: String,
                enum: ['user', 'admin'],
            }],
        default: ['user'],
        required: 'Role for user must be provided.',
    },
    password: {
        type: String,
        required: 'Password must be provided.',
    },
    createAt: {
        type: Date,
        default: Date.now(),
    },
    updatedAt: {
        type: Date,
        default: Date.now(),
    },
});
customerSchema.static('createCustomer', (user, callback) => {
    bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(user.password, salt, (error, hash) => {
            if (error)
                throw error;
            user.password = hash;
            user.save(callback);
        });
    });
});
customerSchema.static('comparePassword', (candidatePassword, hash, callback) => {
    bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
        if (err)
            throw err;
        callback(null, isMatch);
    });
});
customerSchema.static('findByName', (name, callback) => {
    exports.Customer.findOne({ name }, callback).lean();
});
exports.Customer = mongoose_1.model('Customer', customerSchema);
