module.exports = async function (server) {
  try {
    // test code here
    const {user, accessToken} = server.models;
    var pattern = new RegExp('.*'+'gmail'+'.*', "i");
    const res = await user.find({
      where: {
        or: [
          {
            firstName: {
              ilike: '%1%'
            }
          },
          {
            lastName: {
              ilike: '%1%'
            }
          }
        ]
      }
    });
    log(res)
  } catch (error) {
    console.log(error);
    throw error;
  }
};

