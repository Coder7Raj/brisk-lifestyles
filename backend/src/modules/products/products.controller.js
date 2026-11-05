import * as repository from "./products.repository.js";
import {
  createProductSchema,
  productIdSchema,
  productListQuerySchema,
  productSlugSchema,
  updateProductSchema,
} from "./products.schema.js";

function setDatabaseErrorStatus(error) {
  if (error.code === "23505") error.status = 409;
  else if (error.code === "23503") error.status = 422;
  else if (error.code === "23514") error.status = 400;
  return error;
}

function respondDatabaseError(error, response) {
  if (!error.status) return false;
  const message =
    error.status === 409
      ? "A product with this slug already exists."
      : error.status === 422
        ? "The selected category is unavailable."
        : "Product data violates a constraint.";
  response.status(error.status).json({ error: message });
  return true;
}

function productQuery(request) {
  return productListQuerySchema.parse({
    limit: request.query.limit,
    offset: request.query.offset,
    category: request.query.category,
  });
}

export async function listPublic(request, response) {
  const query = productQuery(request);
  const result = await repository.listActive(query);
  response.json({
    data: result.rows,
    limit: query.limit,
    offset: query.offset,
  });
}

export async function listAll(request, response) {
  const query = productQuery(request);
  const result = await repository.listAll(query);
  response.json({
    data: result.rows,
    limit: query.limit,
    offset: query.offset,
  });
}

export async function getPublic(request, response) {
  const slug = productSlugSchema.parse(request.params.slug);
  const result = await repository.findActiveBySlug(slug);
  if (!result.rowCount)
    return response.status(404).json({ error: "Product not found." });
  response.json({ data: result.rows[0] });
}

export async function create(request, response) {
  const product = createProductSchema.parse(request.body);
  try {
    const result = await repository.create(product);
    if (!result.rowCount)
      return response
        .status(422)
        .json({ error: "The selected category is unavailable." });
    response.status(201).json({ data: result.rows[0] });
  } catch (error) {
    if (respondDatabaseError(setDatabaseErrorStatus(error), response)) return;
    throw error;
  }
}

export async function update(request, response) {
  const id = productIdSchema.parse(request.params.id);
  const product = updateProductSchema.parse(request.body);
  if (
    product.category &&
    !(await repository.hasActiveCategory(product.category))
  )
    return response
      .status(422)
      .json({ error: "The selected category is unavailable." });
  try {
    const result = await repository.update(id, product);
    if (!result.rowCount)
      return response.status(404).json({ error: "Product not found." });
    response.json({ data: result.rows[0] });
  } catch (error) {
    if (respondDatabaseError(setDatabaseErrorStatus(error), response)) return;
    throw error;
  }
}

export async function remove(request, response) {
  const id = productIdSchema.parse(request.params.id);
  const result = await repository.softDelete(id);
  if (!result.rowCount)
    return response.status(404).json({ error: "Product not found." });
  response.json({ data: { id: result.rows[0].id, is_active: false } });
}
