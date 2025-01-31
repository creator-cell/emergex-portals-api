import { Model, Document, FilterQuery, PopulateOptions, Query } from 'mongoose';
import { Request } from 'express';

interface PaginationOptions {
  page?: number | string;
  limit?: number | string;
  sort?: string | { [key: string]: 'asc' | 'desc' | 1 | -1 };
  populate?: PopulateOptions | PopulateOptions[];
  search?: {
    fields: string[];
    term: string;
  };
  select?: string | string[];
  filter?: { [key: string]: any };
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    totalItems: number;
    currentPage: number;
    pageSize: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export async function paginate<T extends Document>(
  model: Model<T>,
  options: PaginationOptions
): Promise<PaginatedResult<T>> {
  try {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
      populate,
      search,
      select,
      filter = {}
    } = options;
    
    const pageNumber = Math.max(1, Number(page));
    const pageSize = Math.max(1, Number(limit));
    const skip = (pageNumber - 1) * pageSize;

    let query: FilterQuery<T> = { ...filter } as FilterQuery<T>;

    if (search?.term && search.fields.length > 0) {
      query.$or = search.fields.map(field => ({
        [field]: { $regex: search.term, $options: 'i' }
      })) as FilterQuery<T>[];
    }
    
    let baseQuery: Query<T[], T> = model.find(query);
    
    if (populate) {
      baseQuery = baseQuery.populate(populate as PopulateOptions | PopulateOptions[]);
    }

    if (select) {
      baseQuery = baseQuery.select(select);
    }

    const [data, totalItems] = await Promise.all([
      baseQuery
        .sort(sort)
        .skip(skip)
        .limit(pageSize)
        .exec(),
      model.countDocuments(query)
    ]);

    const totalPages = Math.ceil(totalItems / pageSize);

    return {
      data,
      pagination: {
        totalItems,
        currentPage: pageNumber,
        pageSize,
        totalPages,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1
      }
    };
  } catch (error) {
    throw new Error(`Pagination error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getPaginationOptions(
  req: Request,
  defaultOptions: Partial<PaginationOptions> = {}
): PaginationOptions {
  const {
    page,
    limit,
    sort,
    search,
    searchFields,
    select,
    populate: queryPopulate,  // Renamed to avoid confusion
    ...filter
  } = req.query;

  const options: PaginationOptions = {
    page: (page as string | number | undefined) || defaultOptions.page || 1,
    limit: (limit as string | number | undefined) || defaultOptions.limit || 10,
    sort: sort ? JSON.parse(String(sort)) : defaultOptions.sort || { createdAt: -1 },
    select: select ? String(select).split(',') : defaultOptions.select,
    filter: { ...filter, ...defaultOptions.filter },
    // Merge populate options, giving priority to defaultOptions
    populate: defaultOptions.populate || (queryPopulate ? JSON.parse(String(queryPopulate)) : undefined)
  };

  if (search && searchFields) {
    options.search = {
      term: String(search),
      fields: String(searchFields).split(',')
    };
  }

  return options;
}

export async function createGenericController<T extends Document>(
  model: Model<T>,
  populate?: PopulateOptions | PopulateOptions[]
) {
  return async (req: Request) => {
    const options = getPaginationOptions(req, { populate });
    return paginate(model, options);
  };
}