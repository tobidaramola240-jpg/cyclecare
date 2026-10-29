module.exports = (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ status: 'ok', app: 'CycleCare', timestamp: new Date().toISOString() }));
};
