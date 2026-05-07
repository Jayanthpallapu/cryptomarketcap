import('./src/services/api.js').then(api => {
  console.log('Star Metrics:', api.getStarMetrics());
}).catch(err => {
  console.error('Error loading module:', err);
});
