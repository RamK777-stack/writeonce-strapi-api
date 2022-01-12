"use strict";
const { sanitizeEntity } = require("strapi-utils");
const _ = require("lodash");
const htmlparser = require("htmlparser2");
const { createApi } = require("unsplash-js");
const fetch = require('node-fetch');
global.fetch = fetch;
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const unsplash = createApi({
  accessKey: "91pcc4ZROABANATZb50Lj6z-IxqUI5LQJjAyGrDRsHo",
  fetch: fetch,
});

const alphanumeric_unique = () => {
  return Math.random()
    .toString(36)
    .split("")
    .filter(function (value, index, self) {
      return self.indexOf(value) === index;
    })
    .join("")
    .substr(2, 4);
};

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

const countReactions = (likes, userId) => {
  console.log(userId);
  let reactions = [];
  let userReactions = [];
  likes.forEach((item) => {
    const alreadyPresent = reactions.findIndex((i) => {
      return i.reactionId === item.reaction.id;
    });
    if (alreadyPresent !== -1) {
      reactions[alreadyPresent].count += 1;
    } else {
      reactions.push({
        reactionId: item.reaction.id,
        name: item.reaction.name,
        count: 1,
      });
    }
    if (item.reacted_by === userId) {
      userReactions.push({
        reactionId: item.reaction.id,
        name: item.reaction.name,
      });
    }
  });
  return { reactions, userReactions };
};

module.exports = {
  find: async (ctx) => {
    const user = ctx.state?.user;
    let populate = ["author", "author.user_profile", "bookmarks", "hashtags"];
    let post = await strapi.services.post.find(ctx.request.query, populate);
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
        "slug",
        "author.user_profile.firstName",
        "author.user_profile.lastName",
        "author.user_profile.websiteURL",
        "bookmarks",
        "bookmarks.id",
        "bookmarks.userId",
        "hashtags.id",
        "hashtags.label",
      ],
    });
    const result = removeAuthorFields(sanitizedUser);
    const arr = Object.keys(result).map((key) => {
      const bookMark = result[key].bookmarks.find((i) => i.userId == user?.id);
      let obj = {
        ...result[key],
        bookMarkId: bookMark?.id,
        isBookMarked: bookMark ? true : false,
      };
      obj = _.omit(obj, "bookmarks");
      return obj;
    });
    return arr;
  },

  findOne: async (ctx) => {
    const user = ctx.state?.user;
    let populate = [
      "author",
      "author.user_profile",
      "bookmarks",
      "hashtags",
      "post_likes",
      "post_likes.reaction",
    ];
    let post = await strapi.services.post.find(
      { slug: ctx.params.id },
      populate
    );
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
        "slug",
        "author.user_profile.firstName",
        "author.user_profile.lastName",
        "author.user_profile.websiteURL",
        "bookmarks",
        "bookmarks.id",
        "bookmarks.userId",
        "hashtags.id",
        "hashtags.label",
        "post_likes.id",
        "post_likes.reaction",
        "post_likes.reaction",
        "post_likes.reaction.name",
        "post_likes.reacted_by",
      ],
    });
    const result = removeAuthorFields(sanitizedUser);
    const arr = Object.keys(result).map((key) => {
      const bookMark = result[key].bookmarks.find((i) => i.userId == user?.id);
      const { reactions, userReactions } = countReactions(
        result[key].post_likes,
        user?.id
      );
      let obj = {
        ...result[key],
        bookMarkId: bookMark?.id,
        isBookMarked: bookMark ? true : false,
        countReactions: reactions,
        userReactions: userReactions,
      };
      obj = _.omit(obj, "bookmarks");
      return obj;
    });
    return arr[0] ? arr[0] : {};
  },

  create: async (ctx) => {
    let description = ctx.request.body.description;
    description = parseHtml(description);
    const synopsis = description.substring(0, 220) + "...";
    const reading_time = Math.round(description.length / 450);
    const title = parseHtml(ctx.request.body.title);
    let slug = title.toLowerCase();
    slug = slug.replace(/\s+/g, "-") + `-${alphanumeric_unique()}`;
    ctx.request.body["synopsis"] = synopsis;
    ctx.request.body["title"] = title;
    ctx.request.body["slug"] = slug;
    ctx.request.body["reading_time"] =
      reading_time > 1 ? `${reading_time} Min` : "Less than 1 min";
    let post = strapi.services.post.create(ctx.request.body);
    return post;
  },

  addReaction: async (ctx) => {
    let post = await strapi.services["post-likes"].findOne(ctx.request.body);
    if (!post) {
      let post = await strapi.services.post.findOne({
        id: ctx.request.body.post,
      });
      strapi.services.post.update(
        { id: ctx.request.body.post },
        { likes: parseInt(post.likes) + 1 }
      );
      return await strapi.services["post-likes"].create(ctx.request.body);
    } else {
      let post = await strapi.services.post.findOne({
        id: ctx.request.body.post,
      });
      strapi.services.post.update(
        { id: ctx.request.body.post },
        { likes: parseInt(post.likes) - 1 !== -1 || post.likes }
      );
      return await strapi.services["post-likes"].delete(ctx.request.body);
    }
  },

  unsplashImages: async (ctx) => {
    console.log('ssssssssssssssssssssssssss')
    try {
      const result = await unsplash.search.getPhotos({
        query: ctx.request.body.query || "nature",
        page: 1,
        perPage: 5,
        orientation: "portrait",
      });
      console.log(result, ";;;;;;;;;;;;;;;;;;;;");
      return result?.response;
    } catch (e) {
      console.log(e);
    }
  },
};
