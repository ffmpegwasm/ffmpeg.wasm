module.exports = [
  './ffmpeg', // args[0] is always binary path
  '-nostdin', // Disable interaction mode
  '-hide_banner', // Not to output banner
];
