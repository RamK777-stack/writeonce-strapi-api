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

  /**
   * Create a/an drafts record.
   *
   * @return {Object}
   */
  createOrUpdate: async (ctx) => {
    console.log(strapi.services["draft-block"]);
    const draftBlockPromise = ctx.request.body.draft_blocks.map(
      async (draft_block) =>
        draft_block.id &&
        (await strapi.services["draft-block"].findOne({ id: draft_block.id }))
          ? strapi.services["draft-block"].update(
              { id: draft_block.id },
              _.omit(draft_block, ["id"])
            )
          : strapi.services["draft-block"].create(draft_block)
    );
    let draftBlocks = await Promise.all(draftBlockPromise);
    draftBlocks = (draftBlocks && draftBlocks.map((block) => block.id)) || [];
    ctx.request.body["draft_blocks"] = draftBlocks;
    let drafts = strapi.services.drafts.update(ctx.params, ctx.request.body);
    return drafts;
  },
};
