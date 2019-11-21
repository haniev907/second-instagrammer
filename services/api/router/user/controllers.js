const validate = require('validate.js');
const cdxUtil = require('@cdx/util');

const moment = require('moment');

const collect = (config, cdx) => {
  return {
  	getProfileByName: async (req, res) => {
  		const {
        params: {
          profileName,
        },
      } = req;

      let profile = await cdx.db.user.getByName(profileName);

      if (profile === null) {
        profile = await cdx.db.user.createUser({ name: profileName, });
      }

      const posts = await cdx.db.media.getByUserId(profile._id);

      res.json(new cdxUtil.UserResponse({
        profile,
        posts,
      }));
  	},
    addProfile: async (req, res) => {
      const {
        body: {
          profileName,
        },
      } = req;

      await cdx.db.user.createUser({ name: profileName, });
      
      res.json(new cdxUtil.UserResponse('Profile added'));
    },
    searchProfiles: async (req, res) => {
      const {
        params: {
          profileName,
        },
      } = req;

      const users = await cdx.db.user.searchUsers(profileName);

      res.json(new cdxUtil.UserResponse(users));
    },
  };
};

module.exports.init = (config, cdx) => collect(config, cdx);
