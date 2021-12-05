"use strict";
const { sanitizeEntity } = require("strapi-utils");
const _ = require("lodash");
var htmlparser = require("htmlparser2");
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

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

const parseHtml = (html) => {
  let htmlArray = [];
  let parser = new htmlparser.Parser(
    {
      ontext: function (text) {
        htmlArray.push(text);
      },
    },
    { decodeEntities: true }
  );
  parser.write(html);
  parser.end();
  const text = htmlArray.join(" ").trim();
  return text;
};

module.exports = {
  find: async (ctx) => {
    let populate = ["author", "author.user_profile"];
    let post = await strapi.services.post.find({}, populate);
    const sanitizedUser = sanitizeEntity(post, {
      model: strapi.models.post,
      includeFields: [
        "id",
        "title",
        "description",
        "createdBy",
        "created_at",
        "updated_at",
        "views",
        "markdown",
        "synopsis",
        "likes",
        "comments",
        "reading_time",
        "author.user_profile.firstName",
        "author.user_profile.lastName",
        "author.user_profile.websiteURL",
      ],
    });
    const result = removeAuthorFields(sanitizedUser);
    const arr = Object.keys(result).map((key) => result[key]);
    return arr;
  },

  create: async (ctx) => {
    let description = ctx.request.body.description;
    description = parseHtml(description);
    const synopsis = description.substring(0, 220) + "...";
    const reading_time = Math.round(description.length / 450);
    ctx.request.body["synopsis"] = synopsis;
    ctx.request.body["title"] = parseHtml(ctx.request.body.title);
    ctx.request.body["reading_time"] =
      reading_time > 1 ? `${reading_time} Min` : "Less than 1 min";
    let post = strapi.services.post.create(ctx.request.body);
    return post;
  },
};
