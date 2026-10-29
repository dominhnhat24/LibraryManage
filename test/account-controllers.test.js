import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import bcrypt from 'bcryptjs';
import User from '../src/models/user.model.js';
import { changePasswordWithOtp, requestPasswordChangeOtp, updateProfile } from '../src/controllers/auth.controller.js';

const invoke = (handler, req) => new Promise((resolve, reject) => {
  handler(req, { json: resolve }, (error) => error ? reject(error) : resolve(undefined));
});

const otpHash = (otp) => createHmac('sha256', process.env.JWT_SECRET).update(otp).digest('hex');

test('password OTP request reports missing SMTP configuration without returning or logging an OTP', async (t) => {
  const oldSecret = process.env.JWT_SECRET;
  const oldFindById = User.findById;
  const oldUpdateOne = User.updateOne;
  const oldLog = console.log;
  const oldError = console.error;
  const smtpNames = ['MAIL_HOST', 'MAIL_PORT', 'MAIL_USER', 'MAIL_PASSWORD', 'MAIL_FROM',
    'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM'];
  const oldSmtp = Object.fromEntries(smtpNames.map((name) => [name, process.env[name]]));
  for (const name of smtpNames) delete process.env[name];
  process.env.JWT_SECRET = 'test-secret-with-sufficient-length-for-unit-tests';
  const user = { _id: 'account-owner', email: 'reader@example.test', password_hash: 'existing-hash',
    password_otp_hash: null, password_otp_expires_at: null, password_otp_attempts: 0,
    save: async function save() { storedHash = this.password_otp_hash; return this; } };
  let cleared;
  let storedHash;
  let logCalls = 0;
  User.findById = () => ({ select: async () => user });
  User.updateOne = async (...args) => { cleared = args; return { modifiedCount: 1 }; };
  console.log = console.error = () => { logCalls += 1; };
  t.after(() => {
    User.findById = oldFindById;
    User.updateOne = oldUpdateOne;
    console.log = oldLog;
    console.error = oldError;
    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
    for (const name of smtpNames) {
      if (oldSmtp[name] === undefined) delete process.env[name];
      else process.env[name] = oldSmtp[name];
    }
  });

  await assert.rejects(invoke(requestPasswordChangeOtp, { authUser: { _id: 'account-owner' }, body: {} }),
    { statusCode: 503 });
  assert.match(storedHash, /^[\da-f]{64}$/);
  assert.equal(cleared[0].password_otp_hash, storedHash);
  assert.equal(cleared[0]._id, 'account-owner');
  assert.equal(cleared[1].$set.password_otp_hash, null);
  assert.equal(logCalls, 0);
});

test('password change rejects an incorrect OTP and atomically counts the attempt', async (t) => {
  const oldSecret = process.env.JWT_SECRET;
  const oldFindById = User.findById;
  const oldUpdateOne = User.updateOne;
  process.env.JWT_SECRET = 'test-secret-with-sufficient-length-for-unit-tests';
  const user = { _id: 'account-owner', password_otp_hash: otpHash('123456'),
    password_otp_expires_at: new Date(Date.now() + 60_000), password_otp_attempts: 0 };
  let update;
  User.findById = () => ({ select: async () => user });
  User.updateOne = async (...args) => { update = args; return { modifiedCount: 1 }; };
  t.after(() => {
    User.findById = oldFindById;
    User.updateOne = oldUpdateOne;
    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
  });

  await assert.rejects(invoke(changePasswordWithOtp, {
    authUser: { _id: 'account-owner' }, body: { otp: '000000', new_password: 'new-password-123' }
  }), { statusCode: 400 });
  assert.equal(update[0]._id, 'account-owner');
  assert.equal(update[0].password_otp_attempts.$lt, 5);
  assert.deepEqual(update[1], { $inc: { password_otp_attempts: 1 } });
});

test('password change clears an expired OTP and rejects it', async (t) => {
  const oldSecret = process.env.JWT_SECRET;
  const oldFindById = User.findById;
  const oldUpdateOne = User.updateOne;
  process.env.JWT_SECRET = 'test-secret-with-sufficient-length-for-unit-tests';
  const user = { _id: 'account-owner', password_otp_hash: otpHash('123456'),
    password_otp_expires_at: new Date(Date.now() - 1), password_otp_attempts: 0 };
  let update;
  User.findById = () => ({ select: async () => user });
  User.updateOne = async (...args) => { update = args; return { modifiedCount: 1 }; };
  t.after(() => {
    User.findById = oldFindById;
    User.updateOne = oldUpdateOne;
    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
  });

  await assert.rejects(invoke(changePasswordWithOtp, {
    authUser: { _id: 'account-owner' }, body: { otp: '123456', new_password: 'new-password-123' }
  }), { statusCode: 400 });
  assert.equal(update[0]._id, 'account-owner');
  assert.equal(update[1].$set.password_otp_hash, null);
});

test('password change blocks verification after the configured attempt limit', async (t) => {
  const oldSecret = process.env.JWT_SECRET;
  const oldFindById = User.findById;
  const oldUpdateOne = User.updateOne;
  process.env.JWT_SECRET = 'test-secret-with-sufficient-length-for-unit-tests';
  User.findById = () => ({ select: async () => ({ _id: 'account-owner', password_otp_hash: otpHash('123456'),
    password_otp_expires_at: new Date(Date.now() + 60_000), password_otp_attempts: 5 }) });
  User.updateOne = async () => { throw new Error('Must not write after attempt limit'); };
  t.after(() => {
    User.findById = oldFindById;
    User.updateOne = oldUpdateOne;
    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
  });

  await assert.rejects(invoke(changePasswordWithOtp, {
    authUser: { _id: 'account-owner' }, body: { otp: '123456', new_password: 'new-password-123' }
  }), { statusCode: 429 });
});

test('successful OTP password change uses the authenticated account and never returns or logs secrets', async (t) => {
  const oldSecret = process.env.JWT_SECRET;
  const oldFindById = User.findById;
  const oldFindOneAndUpdate = User.findOneAndUpdate;
  process.env.JWT_SECRET = 'test-secret-with-sufficient-length-for-unit-tests';
  const user = { _id: 'account-owner', password_otp_hash: otpHash('123456'),
    password_otp_expires_at: new Date(Date.now() + 60_000), password_otp_attempts: 0 };
  let filter;
  let update;
  let logCalls = 0;
  const oldLog = console.log;
  const oldError = console.error;
  User.findById = () => ({ select: async () => user });
  User.findOneAndUpdate = async (...args) => { [filter, update] = args; return { _id: 'account-owner' }; };
  console.log = console.error = () => { logCalls += 1; };
  t.after(() => {
    User.findById = oldFindById;
    User.findOneAndUpdate = oldFindOneAndUpdate;
    console.log = oldLog;
    console.error = oldError;
    if (oldSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = oldSecret;
  });

  const response = await invoke(changePasswordWithOtp, {
    authUser: { _id: 'account-owner' }, body: { otp: '123456', new_password: 'new-password-123' }
  });
  assert.equal(filter._id, 'account-owner');
  assert.equal(update.$set.refresh_token_hash, null);
  assert.equal(await bcrypt.compare('new-password-123', update.$set.password_hash), true);
  assert.equal(JSON.stringify(response).includes('123456'), false);
  assert.equal(JSON.stringify(response).includes('new-password-123'), false);
  assert.equal(logCalls, 0);
});

test('profile updates are scoped to the authenticated account and ignore privilege fields', async (t) => {
  const oldFindByIdAndUpdate = User.findByIdAndUpdate;
  let ownerId;
  let update;
  User.findByIdAndUpdate = async (id, changes) => {
    ownerId = id;
    update = changes;
    return { _id: id, id, name: 'Updated', email: 'reader@example.com', role: 'USER',
      hasActiveVip: () => false, hasActivePremium: () => false };
  };
  t.after(() => { User.findByIdAndUpdate = oldFindByIdAndUpdate; });

  await invoke(updateProfile, {
    authUser: { _id: 'authenticated-owner' },
    body: { name: 'Updated', role: 'ADMIN', is_premium: true, user_id: 'other-user' }
  });
  assert.equal(ownerId, 'authenticated-owner');
  assert.deepEqual(update.$set, { name: 'Updated' });
});
