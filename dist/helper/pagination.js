"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.paginate = paginate;
exports.getPaginationOptions = getPaginationOptions;
exports.createGenericController = createGenericController;
async function paginate(model, options) {
    try {
        const { page = 1, limit = 10, sort = { createdAt: -1 }, populate, search, select, filter = {} } = options;
        const pageNumber = Math.max(1, Number(page));
        const pageSize = Math.max(1, Number(limit));
        const skip = (pageNumber - 1) * pageSize;
        let query = { ...filter };
        if (search?.term && search.fields.length > 0) {
            query.$or = search.fields.map(field => ({
                [field]: { $regex: search.term, $options: 'i' }
            }));
        }
        let baseQuery = model.find(query);
        if (populate) {
            baseQuery = baseQuery.populate(populate);
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
    }
    catch (error) {
        throw new Error(`Pagination error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
function getPaginationOptions(req, defaultOptions = {}) {
    const { page, limit, sort, search, searchFields, select, populate: queryPopulate, // Renamed to avoid confusion
    ...filter } = req.query;
    const options = {
        page: page || defaultOptions.page || 1,
        limit: limit || defaultOptions.limit || 10,
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
async function createGenericController(model, populate) {
    return async (req) => {
        const options = getPaginationOptions(req, { populate });
        return paginate(model, options);
    };
}
