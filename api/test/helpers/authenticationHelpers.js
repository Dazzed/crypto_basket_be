/**
 * Creates a User.
 */
const createUser = async ({app, params}) => {
  const User = app.models.user;
  const count = await User.count();
  const user = await User.create({id: count + 1, ...params});

  return user;
};

/**
 * Creates a role and adds to the User.
 */
const addRoleToUser = async ({app, role: name, user}) => {
  const Role = app.models.role;
  const RoleMapping = app.models.roleMapping;

  const fields = {name};
  await Role.findOrCreate({fields}, fields);
  const role = await Role.findOne({where: fields});
  const roleMapping = await RoleMapping.create({
    principalType: RoleMapping.USER,
    principalId: user.id,
    roleId: role.id,
  });

  return roleMapping;
};

/**
 * Creates a User and logs in. Returns the accessToken for the logged in user.
 */
const createUserAndLogIn = async ({app, role, params}) => {
  const User = app.models.user;
  const user = await createUser({app, params});

  if (role) {
    await addRoleToUser({app, role, user});
  }

  const accessToken = await User.login({
    email: params.email,
    password: params.password,
  });

  return accessToken;
};

// Set globals.
global.createUser = createUser;
global.createUserAndLogIn = createUserAndLogIn;
