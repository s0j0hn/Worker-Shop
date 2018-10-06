import * as bcrypt from 'bcryptjs';
import { Document, Model, model, Schema } from 'mongoose';

export interface ICustomer extends Document {
  name: string;
  password: string;
  roles: string[];
}

export interface ICustomerModel {
  createUser(user: ICustomer, callback: () => void): void;
  comparePassword(candidatePassword: string, hash: string, callback: (err: Error, success: boolean) => void): void;
  findByName(name: string, callback: (err: Error, customer: ICustomer) => void): void;
}

const validateUsername = (username): boolean => {
  const usernameRegex = /^(?=[\w.-]+$)(?!.*[._-]{2})(?!\.)(?!.*\.$).{3,34}$/;
  return (username && usernameRegex.test(username));
};

const customerSchema = new Schema({
  name: {
    type: String,
    required: 'Name must be provided.',
    index: {
      unique: true,
      sparse: true, // For this to work on a previously indexed field, the index must be dropped & the application restarted.
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

customerSchema.static('createCustomer', (user: ICustomer, callback: () => void) => {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(user.password, salt, (error, hash) => {
      if (error) throw error;
      user.password = hash;
      user.save(callback);
    });
  });
});

customerSchema.static('comparePassword', (candidatePassword: string, hash: string, callback: (err: Error, success: boolean) => void) => {
  bcrypt.compare(candidatePassword, hash, (err, isMatch) => {
    if (err) throw err;
    callback(null, isMatch);
  });
});

customerSchema.static('findByName', (name: string, callback: () => void) => {
  Customer.findOne({ name }, callback).lean();
});

export type CustomerModel = Model<ICustomer> & ICustomerModel & ICustomer;

export const Customer: CustomerModel = model<ICustomer>('Customer', customerSchema) as CustomerModel;
