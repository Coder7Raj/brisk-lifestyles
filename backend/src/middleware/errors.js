export function notFound(_request, response) {
  response.status(404).json({ error: 'Resource not found.' });
}

export function errorHandler(error, _request, response, _next) {
  if (error?.name === 'ZodError') {
    return response.status(400).json({ error: 'Please check your input.', details: error.issues.map(({ path, message }) => ({ path: path.join('.'), message })) });
  }
  console.error('Request failed:', error?.message || 'Unknown error');
  return response.status(500).json({ error: 'Something went wrong. Please try again.' });
}
