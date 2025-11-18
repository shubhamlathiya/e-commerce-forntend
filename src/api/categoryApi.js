// api/categoryApi.js
import api from "./client";
export const categoryApi = {
    /**
     * Get a paginated list of categories
     * @param {Object} params - Query parameters (page, limit, search, etc.)
     * @returns {Promise}
     */
    listCategories: async (params = {}) => {
        const response = await api.get('/api/catalog/categories', { params });
        return response.data;
    },

    /**
     * Create a new category (admin only)
     * @param {Object} categoryData - Category data
     * @returns {Promise}
     */
    createCategory: async (categoryData) => {
        const response = await api.post('/api/catalog/categories', categoryData);
        return response.data;
    },

    /**
     * Get category tree structure
     * @returns {Promise}
     */
    getCategoryTree: async () => {
        const response = await api.get('/api/catalog/categories/tree');
        return response.data;
    },

    /**
     * Get breadcrumbs for a specific category
     * @param {string} categoryId - Category ID
     * @returns {Promise}
     */
    getCategoryBreadcrumbs: async (categoryId) => {
        const response = await api.get(`/api/catalog/categories/${categoryId}/breadcrumbs`);
        return response.data;
    },

    /**
     * Get category by ID
     * @param {string} categoryId - Category ID
     * @returns {Promise}
     */
    getCategoryById: async (categoryId) => {
        const response = await api.get(`/api/catalog/categories/${categoryId}`);
        return response.data;
    },

    /**
     * Update category details (Admin only)
     * @param {string} categoryId - Category ID
     * @param {Object} updateData - Updated category data
     * @returns {Promise}
     */
    updateCategory: async (categoryId, updateData) => {
        const response = await api.patch(`/api/catalog/categories/${categoryId}`, updateData);
        return response.data;
    },

    /**
     * Delete a category (Admin only)
     * @param {string} categoryId - Category ID
     * @returns {Promise}
     */
    deleteCategory: async (categoryId) => {
        const response = await api.delete(`/api/catalog/categories/${categoryId}`);
        return response.data;
    },

    /**
     * Get subcategories for a specific category
     * This uses the tree endpoint and filters for children of the given category
     * @param {string} categoryId - Parent category ID
     * @returns {Promise}
     */
    getSubCategories: async (categoryId) => {
        try {
            // First, try to get the category tree and find children
            const treeResponse = await api.get('/api/catalog/categories/tree');
            const categories = treeResponse.data?.data || treeResponse.data || [];

            // Function to find category by ID in the tree
            const findCategoryInTree = (categories, targetId) => {
                for (const category of categories) {
                    if (category._id === targetId || category.id === targetId) {
                        return category;
                    }
                    if (category.children && category.children.length > 0) {
                        const found = findCategoryInTree(category.children, targetId);
                        if (found) return found;
                    }
                }
                return null;
            };

            const parentCategory = findCategoryInTree(categories, categoryId);
            return {
                data: parentCategory?.children || []
            };
        } catch (error) {
            console.error('Error fetching subcategories from tree:', error);

            // Fallback: try to get all categories and filter by parentId
            try {
                const allCategories = await api.get('/api/catalog/categories', {
                    params: { limit: 1000 }
                });
                const categories = allCategories.data?.data?.items || allCategories.data?.items || allCategories.data || [];

                const subCategories = categories.filter(cat =>
                    cat.parentId === categoryId ||
                    cat.parentId?.toString() === categoryId.toString() ||
                    cat.parent?._id === categoryId ||
                    cat.parent?.id === categoryId
                );

                return { data: subCategories };
            } catch (fallbackError) {
                console.error('Fallback subcategories fetch failed:', fallbackError);
                throw new Error('Failed to fetch subcategories');
            }
        }
    },

    /**
     * Search categories by name
     * @param {string} searchTerm - Search term
     * @param {Object} params - Additional parameters
     * @returns {Promise}
     */
    searchCategories: async (searchTerm, params = {}) => {
        const response = await api.get('/api/catalog/categories', {
            params: { search: searchTerm, ...params }
        });
        return response.data;
    },

    /**
     * Get categories with parent information
     * @param {Object} params - Query parameters
     * @returns {Promise}
     */
    getCategoriesWithParents: async (params = {}) => {
        const response = await api.get('/api/catalog/categories', {
            params: { ...params, populate: 'parent' }
        });
        return response.data;
    }
};

export default categoryApi;