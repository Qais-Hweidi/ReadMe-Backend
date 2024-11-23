export const validate = (schema) => {
  return (req, res, next) => {
    // Handle authors field specifically for form-data
    if (req.body.authors) {
      try {
        if (typeof req.body.authors === 'string') {
          // Try to parse as JSON array first
          try {
            req.body.authors = JSON.parse(req.body.authors);
          } catch (e) {
            // If parsing fails, treat it as a single ID
            req.body.authors = [req.body.authors];
          }
        } else if (!Array.isArray(req.body.authors)) {
          req.body.authors = [req.body.authors];
        }
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'Invalid authors format',
        });
      }
    }

    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }
    next();
  };
};
