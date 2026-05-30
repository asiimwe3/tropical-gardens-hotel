const { send } = require("./_lib");

module.exports = async (_req, res) => {
  send(res, 200, { ok: true, service: "tropical-gardens-vercel-api" });
};
