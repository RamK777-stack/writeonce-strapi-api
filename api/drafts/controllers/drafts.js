const { parseMultipartData, sanitizeEntity } = require("strapi-utils");
const _ = require("lodash");

module.exports = {
  /**
   * Create a/an drafts record.
   *
   * @return {Object}
   */
  create: async (ctx) => {
    const draftBlockPromise = ctx.request.body.draft_blocks.map((draft_block) =>
      strapi.services["draft-block"].create(draft_block)
    );
    let draftBlocks = await Promise.all(draftBlockPromise);
    draftBlocks = (draftBlocks && draftBlocks.map((block) => block.id)) || [];
    ctx.request.body["draft_blocks"] = draftBlocks;
    let drafts = strapi.services.drafts.add(ctx.request.body);
    return drafts;
  },

  delete: async (ctx) => {
    console.log(ctx.params,'22')
    await strapi.services["draft-block"].delete({
      draft: ctx.params.id,
    });
    let drafts = strapi.services.drafts.delete({id: ctx.params.id});
    return drafts;
  },

  /**
   * Create a/an drafts record.
   *
   * @return {Object}
   */
  createOrUpdate: async (ctx) => {
    const draftDeleteBlockPromise = ctx.request.body.draft_blocks.map(
      async (draft_block) =>
        typeof draft_block.id === "number" &&
        (await strapi.services["draft-block"].delete({
          draft: ctx.request.body.draftId,
        }))
    );
    const result = await Promise.all(draftDeleteBlockPromise);
    const draftCreateBlockPromise = ctx.request.body.draft_blocks.map(
      async (draft_block) => strapi.services["draft-block"].create(draft_block)
    );
    let draftBlocks = await Promise.all(draftCreateBlockPromise);
    draftBlocks =
      (draftBlocks &&
        draftBlocks
          .filter((block) => block)
          .map((block) => block && block.id)) ||
      [];
    console.log(draftBlocks, "11111");
    ctx.request.body["draft_blocks"] = draftBlocks;
    let drafts = strapi.services.drafts.update(ctx.params, ctx.request.body);
    return drafts;
  },
};
