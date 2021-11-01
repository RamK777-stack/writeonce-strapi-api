"use strict";

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-services)
 * to customize this service
 */
const _ = require("lodash");

module.exports = {
  /**
   * Promise to add a/an review.
   *
   * @return {Promise}
   */
  add: async (values) => {
    // Extract values related to relational data.
    const Drafts = strapi.models.drafts;
    const relations = _.pick(
      values,
      Drafts.associations.map((ast) => ast.alias)
    );
    const data = _.omit(
      values,
      Drafts.associations.map((ast) => ast.alias)
    );
    // Create entry with no-relational data.
    const entry = await strapi.query("drafts").create(data);

    // Create relational data and return the entry.
    return Drafts.updateRelations({ _id: entry.id, values: relations });
  },

  update: async (params, values) => {
    // Extract values related to relational data.
    const Drafts = strapi.models.drafts;
    const relations = _.pick(
      values,
      Drafts.associations.map((ast) => ast.alias)
    );
    const data = _.omit(
      values,
      Drafts.associations.map((ast) => ast.alias)
    );
    // Create entry with no-relational data.
    const entry = await strapi
      .query("drafts")
      .update(params, data, { multi: true });

    // Create relational data and return the entry.
    return Drafts.updateRelations(Object.assign(params, { values: relations }));
  },
};
