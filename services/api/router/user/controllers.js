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

      const profile = await cdx.db.user.getByName(profileName);
      let posts = [];

      if (profile !== null) {
        posts = await cdx.db.media.getByUserId(profile._id);
      }

      res.json(new cdxUtil.UserResponse({
        profile,
        posts,
      }));
  	},
  };
};

module.exports.init = (config, cdx) => collect(config, cdx);
