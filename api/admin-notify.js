const { method, readBody, send } = require("./_lib");
const { notifyAdmin } = require("./_notify");

module.exports = async (req, res) => {
  if (!method(req, res, ["POST"])) return;
  try {
    const body = await readBody(req);
    const type = body.type || "booking";
    const details = body.details || {};
    
    // Fire notification (non-blocking)
    const result = await notifyAdmin(type, details);
    
    send(res, 200, { 
      success: true, 
      telegram: result.telegram, 
      email: result.email 
    });
  } catch (error) {
    send(res, 500, { error: error.message });
  }
};
// v1.0.1
