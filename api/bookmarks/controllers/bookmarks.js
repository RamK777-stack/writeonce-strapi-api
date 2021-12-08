"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */
const { sanitizeEntity } = require("strapi-utils");
const _ = require("lodash");

const removeAuthorFields = (entity) => {
  const sanitizedValue = _.omit(entity, [
    "author.created_at",
    "author.updated_at",
    "author.user_profile.created_at",
    "author.user_profile.updated_at",
  ]);

  _.forEach(sanitizedValue, (value, key) => {
    if (_.isArray(value)) {
      sanitizedValue[key] = value.map(removeAuthorFields);
    } else if (_.isObject(value) && !_.isDate(value)) {
      sanitizedValue[key] = removeAuthorFields(value);
    }
  });

  return sanitizedValue;
};

module.exports = {
  find: async (ctx) => {
    const user = ctx.state.user;
    let populate = ["post.author", "post.author.user_profile"];
    let bookmarks = await strapi.services.bookmarks.find(
      { userId: user.id },
      populate
    );

    const sanitizedResult = sanitizeEntity(bookmarks, {
      model: strapi.models.bookmarks,
      includeFields: [
        "id",
        "userId",
        "created_at",
        "updated_at",
        "post.id",
        "post.title",
        "post.created_at",
        "post.updated_at",
        "post.synopsis",
        "post.likes",
        "post.comments",
        "post.reading_time",
        "post.author.user_profile.firstName",
        "post.author.user_profile.lastName",
        "post.author.user_profile.websiteURL",
      ],
    });
    const result = removeAuthorFields(sanitizedResult);
    const arr = Object.keys(result).map((key) => {
      let obj = {
        ...result[key],
        ...result[key].post,
        bookMarkId: result[key].id,
      };
      obj = _.omit(obj, "post");
      return obj;
    });
    return arr;
  },

  create: async (ctx) => {
    const user = ctx.state.user;
    ctx.request.body["userId"] = user.id;
    let bookmarks = strapi.services.bookmarks.create(ctx.request.body);
    return bookmarks;
  },
};
