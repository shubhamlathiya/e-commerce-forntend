import React, {useEffect, useState} from "react";
import {useNavigate, useParams} from "react-router-dom";
import MasterLayout from "../../masterLayout/MasterLayout";
import Breadcrumb from "../../components/Breadcrumb";
import {ToastContainer, toast} from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import productApi from "../../api/productApi";
import pricingApi from "../../api/pricingApi";
import stockApi from "../../api/stockApi";
import attributesApi from "../../api/attributesApi";
import variantsApi from "../../api/variantsApi";
import * as seoService from "../../api/seoService";
import faqApi from "../../api/faqApi";
import categoryApi from "../../api/categoryApi";
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';

const ProductDetailsPage = () => {
    const {id} = useParams();
    const navigate = useNavigate();

    // Main product state
    const [product, setProduct] = useState({
        title: "",
        slug: "",
        sku: "",
        description: "",
        type: "simple",
        brandId: "",
        categoryIds: [],
        status: false,
        isFeatured: false,
        tags: []
    });

    // Pricing state
    const [priceForm, setPriceForm] = useState({
        basePrice: "",
        discountType: "percent",
        discountValue: "0",
        currency: "USD",
        status: true
    });

    // Variants and attributes
    const [selectedAttributes, setSelectedAttributes] = useState([]);
    const [attributeValues, setAttributeValues] = useState({});
    const [generatedVariants, setGeneratedVariants] = useState([]);
    const [isGeneratingVariants, setIsGeneratingVariants] = useState(false);

    // Shipping
    const [shippingForm, setShippingForm] = useState({
        class: "",
        customClassName: "",
        cost: "",
        estimated: ""
    });

    // Tabs and forms
    const [activeTab, setActiveTab] = useState("attributes");
    const [faqs, setFaqs] = useState([{question: "", answer: ""}]);
    const [seoForm, setSeoForm] = useState({
        metaTitle: "",
        metaDescription: "",
        keywords: "",
        slug: ""
    });

    // Stock management
    const [stockLogs, setStockLogs] = useState([]);
    const [stockForm, setStockForm] = useState({
        quantity: "",
        type: "in",
        note: ""
    });
    const [initialStock, setInitialStock] = useState(0);

    // UI state
    const [selectedTags, setSelectedTags] = useState([]);
    const [isSaving, setIsSaving] = useState(false);
    const [loading, setLoading] = useState(true);

    // Image states
    const [thumbnailFile, setThumbnailFile] = useState(null);
    const [imageFiles, setImageFiles] = useState([]);
    const [thumbPreview, setThumbPreview] = useState("");
    const [imagePreviews, setImagePreviews] = useState([]);
    const [existingThumbnail, setExistingThumbnail] = useState("");
    const [existingImages, setExistingImages] = useState([]);

    // Data lists
    const [brands, setBrands] = useState([]);
    const [tags, setTags] = useState([]);
    const [attributes, setAttributes] = useState([]);
    const [categories, setCategories] = useState([]);
    const [subCategories, setSubCategories] = useState([]);
    const [loadingSubCategories, setLoadingSubCategories] = useState(false);

    // Modal states
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [newCategory, setNewCategory] = useState({name: "", parentId: ""});
    const [newBrand, setNewBrand] = useState({name: ""});

    // Fetch initial data
    useEffect(() => {
        fetchInitialData();
        if (id) {
            loadProductData();
        }
    }, [id]);

    // Fetch subcategories when main category changes
    useEffect(() => {
        if (product.categoryIds.length > 0) {
            const mainCategoryId = product.categoryIds[0];
            fetchSubCategories(mainCategoryId);
        } else {
            setSubCategories([]);
        }
    }, [product.categoryIds]);

    // Reset variants when product type changes to simple
    useEffect(() => {
        if (product.type === "simple") {
            setGeneratedVariants([]);
            setSelectedAttributes([]);
            setAttributeValues({});
        }
    }, [product.type]);

    // Load variant pricing data
    const loadVariantPricing = async (productId, variants) => {
        if (!variants || !Array.isArray(variants) || variants.length === 0) return;

        try {
            const variantPricingPromises = variants.map(async (variant) => {
                try {
                    const pricingRes = await pricingApi.getProductPricing({
                        productId: productId,
                        variantId: variant._id || variant.id
                    });

                    let variantPricing = {};
                    if (pricingRes?.data) {
                        variantPricing = pricingRes.data;
                    } else if (pricingRes) {
                        variantPricing = pricingRes;
                    }

                    return {
                        variantId: variant._id || variant.id,
                        pricing: variantPricing
                    };
                } catch (error) {
                    console.error(`Error loading pricing for variant ${variant._id}:`, error);
                    return {
                        variantId: variant._id || variant.id,
                        pricing: {}
                    };
                }
            });

            const variantPricingResults = await Promise.all(variantPricingPromises);

            // Update generated variants with their pricing data
            setGeneratedVariants(prev =>
                prev.map(variant => {
                    const variantPricing = variantPricingResults.find(
                        vp => vp.variantId === (variant.variantId || variant._id)
                    );

                    if (variantPricing?.pricing) {
                        return {
                            ...variant,
                            price: variantPricing.pricing.finalPrice || variantPricing.pricing.basePrice || variant.price,
                            basePrice: variantPricing.pricing.basePrice || variant.price
                        };
                    }
                    return variant;
                })
            );

        } catch (error) {
            console.error("Error loading variant pricing:", error);
        }
    };

    // Load product data
    const loadProductData = async () => {
        try {
            setLoading(true);

            // Load product details
            const productRes = await productApi.getProduct(id);
            const productData = productRes?.data || productRes || {};


            // Set product state
            const productState = {
                title: productData.title || "",
                slug: productData.slug || "",
                sku: productData.sku || "",
                description: productData.description || "",
                type: productData.type || "simple",
                brandId: productData.brandId?._id || productData.brandId?.id || productData.brandId || "",
                categoryIds: Array.isArray(productData.categoryIds)
                    ? productData.categoryIds.map(cat => cat._id || cat.id || cat)
                    : [],
                status: productData.status || false,
                isFeatured: productData.isFeatured || false,
                tags: Array.isArray(productData.tags)
                    ? productData.tags.map(tag => tag._id || tag.id || tag)
                    : []
            };

            setProduct(productState);

            // Set selected tags
            if (Array.isArray(productData.tags)) {
                const tagIds = productData.tags.map(tag => tag._id || tag.id || tag).filter(Boolean);
                setSelectedTags(tagIds);
            }

            // Set existing images
            if (productData.thumbnail) {
                setExistingThumbnail(productData.thumbnail);
            }
            if (Array.isArray(productData.images)) {
                setExistingImages(productData.images);
            }

            // Shipping data
            const shippingData = productData.shipping || {};
            setShippingForm({
                class: shippingData.class || "",
                customClassName: "",
                cost: shippingData.cost || "",
                estimated: shippingData.estimated || ""
            });

            // Load variants first (needed for pricing)
            let variantsData = [];
            if (productData.type === "variant") {
                try {
                    const variantsRes = await variantsApi.listVariants({ productId: id });
                    variantsData = Array.isArray(variantsRes?.data)
                        ? variantsRes.data
                        : (variantsRes?.data?.items || variantsRes?.items || []);



                    if (variantsData.length > 0) {
                        const formattedVariants = variantsData.map(variant => ({
                            ...variant,
                            tempId: variant._id || variant.id,
                            variantId: variant._id || variant.id,
                            displayAttributes: Array.isArray(variant.attributes)
                                ? variant.attributes.map(attr => `${attr.name}: ${attr.value}`).join(', ')
                                : '',
                            price: variant.price || 0,
                            stock: variant.stock || 0,
                            status: variant.status !== false
                        }));
                        setGeneratedVariants(formattedVariants);

                        // Load attributes for variant products
                        if (variantsData[0].attributes) {
                            const variantAttributes = variantsData[0].attributes;
                            const attributeIds = [...new Set(variantAttributes.map(attr => attr.attributeId || attr.id))];

                            setSelectedAttributes(attributeIds);

                            const attributeValuesMap = {};
                            attributeIds.forEach(attrId => {
                                const values = [...new Set(variantAttributes
                                    .filter(attr => (attr.attributeId || attr.id) === attrId)
                                    .map(attr => attr.value))];
                                attributeValuesMap[attrId] = values;
                            });

                            setAttributeValues(attributeValuesMap);
                        }
                    }
                } catch (error) {
                    console.error("Error loading variants:", error);
                }
            }

            // Load pricing
            try {
                const pricingRes = await pricingApi.getProductPricing({productId: id});


                let pricingData = {};

                // Handle different response structures
                if (pricingRes?.data) {
                    pricingData = pricingRes.data;
                } else if (Array.isArray(pricingRes)) {
                    // If it's an array, find the main product pricing (without variantId)
                    const mainPricing = pricingRes.find(p => !p.variantId);
                    pricingData = mainPricing || {};
                } else if (pricingRes) {
                    pricingData = pricingRes;
                }



                setPriceForm({
                    basePrice: pricingData.basePrice || "",
                    discountType: pricingData.discountType || "percent",
                    discountValue: pricingData.discountValue || "0",
                    currency: pricingData.currency || "USD",
                    status: pricingData.status !== false
                });

                // For variant products, load variant-specific pricing
                if (productData.type === "variant" && variantsData.length > 0) {
                    await loadVariantPricing(id, variantsData);
                }

            } catch (error) {
                console.error("Error loading pricing:", error);
                // Set default pricing if API fails
                setPriceForm({
                    basePrice: "",
                    discountType: "percent",
                    discountValue: "0",
                    currency: "USD",
                    status: true
                });
            }

            // Load FAQs
            try {
                const faqsRes = await faqApi.getProductFaqs(id);
                let faqsData = [];

                if (Array.isArray(faqsRes?.data)) {
                    faqsData = faqsRes.data;
                } else if (Array.isArray(faqsRes?.data?.items)) {
                    faqsData = faqsRes.data.items;
                } else if (Array.isArray(faqsRes?.items)) {
                    faqsData = faqsRes.items;
                } else if (faqsRes?.data) {
                    faqsData = [faqsRes.data];
                }

                if (faqsData.length > 0) {
                    setFaqs(faqsData.map(faq => ({
                        _id: faq._id || faq.id,
                        question: faq.question || "",
                        answer: faq.answer || ""
                    })));
                } else {
                    setFaqs([{question: "", answer: ""}]);
                }
            } catch (error) {
                console.error("Error loading FAQs:", error);
                setFaqs([{question: "", answer: ""}]);
            }

            // Load SEO
            try {
                const seoRes = await seoService.getSeo(id);
                const seoData = seoRes?.data || seoRes || {};
                setSeoForm({
                    metaTitle: seoData.metaTitle || "",
                    metaDescription: seoData.metaDescription || "",
                    keywords: Array.isArray(seoData.keywords)
                        ? seoData.keywords.join(", ")
                        : (seoData.keywords || ""),
                    slug: seoData.slug || productData.slug || ""
                });
            } catch (error) {
                console.error("Error loading SEO:", error);
            }

            // Load stock logs
            await fetchStockLogs(id);

        } catch (error) {
            console.error("Error loading product data:", error);
            toast.error("Failed to load product data");
        } finally {
            setLoading(false);
        }
    };

    const fetchInitialData = async () => {
        try {
            const [brandsRes, categoriesRes, tagsRes, attributesRes] = await Promise.all([
                productApi.getBrands(),
                categoryApi.listCategories({limit: 1000}),
                productApi.getTags(),
                attributesApi.listAttributes({page: 1, limit: 100})
            ]);

            const b = Array.isArray(brandsRes?.data) ? brandsRes.data : (brandsRes?.data?.items || brandsRes?.items || brandsRes || []);
            const c = Array.isArray(categoriesRes?.data) ? categoriesRes.data : (categoriesRes?.data?.items || categoriesRes?.items || categoriesRes || []);
            const t = Array.isArray(tagsRes?.data) ? tagsRes.data : (tagsRes?.data?.items || tagsRes?.items || tagsRes || []);
            const attrItems = Array.isArray(attributesRes?.items) ? attributesRes.items : (attributesRes?.data?.items || attributesRes?.data || attributesRes || []);

            setBrands(b.map((x) => ({id: x._id || x.id, name: x.name})));
            setCategories(c.map((x) => ({id: x._id || x.id, name: x.name})));
            setTags(t.map((x) => ({id: x._id || x.id, name: x.name})));
            setAttributes(attrItems.map((a) => ({
                id: a._id || a.id,
                name: a.name || a.title || "Attribute",
                values: Array.isArray(a.values) ? a.values.map(v => ({
                    value: typeof v === 'string' ? v : v.value || v.label || v.name,
                    label: typeof v === 'string' ? v : v.label || v.value || v.name
                })) : []
            })));

        } catch (e) {
            toast.error(e?.response?.data?.message || "Failed to load catalog lists");
        }
    };

    const fetchSubCategories = async (categoryId) => {
        if (!categoryId) return;

        setLoadingSubCategories(true);
        try {
            const subCategoriesRes = await categoryApi.getSubCategories(categoryId);
            const subCats = Array.isArray(subCategoriesRes?.data?.items) ? subCategoriesRes.data.items :
                Array.isArray(subCategoriesRes?.data) ? subCategoriesRes.data :
                    Array.isArray(subCategoriesRes?.items) ? subCategoriesRes.items :
                        (subCategoriesRes?.data || subCategoriesRes || []);

            const formattedSubCats = subCats.map((x) => ({
                id: x._id || x.id,
                name: x.name,
                parentId: x.parentId
            }));

            setSubCategories(formattedSubCats);

        } catch (err) {
            console.error("Error fetching subcategories:", err);
            toast.error("Failed to load subcategories");
            setSubCategories([]);
        } finally {
            setLoadingSubCategories(false);
        }
    };

    // Fetch stock logs
    const fetchStockLogs = async (productId) => {
        if (!productId) return;
        try {
            const response = await stockApi.listStockLogs({productId});
            const logs = Array.isArray(response?.data) ? response.data :
                (response?.data?.items || response?.items || response?.data || []);

            setStockLogs(logs);
        } catch (error) {
            console.error("Error fetching stock logs:", error);
            setStockLogs([]);
        }
    };

    // Entity creation helpers
    const ensureEntity = async (type, data) => {
        try {
            let created;
            switch (type) {
                case "brands":
                    created = await productApi.createBrand(data);
                    break;
                case "categories":
                    created = await productApi.createCategory(data);
                    break;
                case "tags":
                    created = await productApi.createTag(data);
                    break;
                default:
                    throw new Error(`Unknown entity type: ${type}`);
            }

            const item = created?.item || created?.data || created;
            if (type === "brands") setBrands((prev) => [item, ...prev]);
            if (type === "categories") setCategories((prev) => [item, ...prev]);
            if (type === "tags") setTags((prev) => [item, ...prev]);

            toast.success(`${type.slice(0, -1)} created successfully`);
            return item;
        } catch (e) {
            console.error(`Failed to create ${type}:`, e);
            toast.error(`Failed to create ${type.slice(0, -1)}`);
            return null;
        }
    };

    // Category Modal Handlers
    const openCategoryModal = () => setShowCategoryModal(true);
    const closeCategoryModal = () => {
        setShowCategoryModal(false);
        setNewCategory({name: "", parentId: ""});
    };

    const handleCreateCategory = async () => {
        if (!newCategory.name.trim()) {
            toast.error("Category name is required");
            return;
        }
        const created = await ensureEntity("categories", newCategory);
        if (created?._id || created?.id) {
            setProduct(prev => ({
                ...prev,
                categoryIds: [created._id || created.id]
            }));
            closeCategoryModal();
        }
    };

    // Brand Modal Handlers
    const openBrandModal = () => setShowBrandModal(true);
    const closeBrandModal = () => {
        setShowBrandModal(false);
        setNewBrand({name: ""});
    };

    const handleCreateBrand = async () => {
        if (!newBrand.name.trim()) {
            toast.error("Brand name is required");
            return;
        }
        const created = await ensureEntity("brands", newBrand);
        if (created?._id || created?.id) {
            setProduct(prev => ({...prev, brandId: created._id || created.id}));
            closeBrandModal();
        }
    };

    // Tag Handlers
    const tagOptions = tags.map(tag => ({value: tag.id, label: tag.name}));
    const selectedTagOptions = tagOptions.filter(tag => selectedTags.includes(tag.value));

    const handleTagChange = (selectedOptions) => {
        const selectedIds = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setSelectedTags(selectedIds);
    };

    const handleCreateTag = async (inputValue) => {
        const created = await ensureEntity("tags", {name: inputValue.trim()});
        if (created?._id || created?.id) {
            return {value: created._id || created.id, label: created.name};
        }
        return null;
    };

    // Attribute Handlers
    const handleAttributeToggle = (attrId) => {
        setSelectedAttributes(prev => {
            if (prev.includes(attrId)) {
                setAttributeValues(prevValues => {
                    const newValues = {...prevValues};
                    delete newValues[attrId];
                    return newValues;
                });
                return prev.filter(id => id !== attrId);
            } else {
                return [...prev, attrId];
            }
        });
    };

    const handleAttributeValuesChange = (attrId, selectedOptions) => {
        const selectedValues = selectedOptions ? selectedOptions.map(option => option.value) : [];
        setAttributeValues(prev => ({...prev, [attrId]: selectedValues}));
    };

    const getAttributeValuesOptions = (attrId) => {
        const attribute = attributes.find(attr => attr.id === attrId);
        return attribute?.values || [];
    };

    const getSelectedAttributeValues = (attrId) => {
        const selectedValues = attributeValues[attrId] || [];
        const attribute = attributes.find(attr => attr.id === attrId);
        return attribute?.values.filter(value => selectedValues.includes(value.value)) || [];
    };

    // Category handlers
    const handleMainCategoryChange = (categoryId) => {
        setProduct(prev => ({
            ...prev,
            categoryIds: categoryId ? [categoryId] : []
        }));
    };

    const handleSubCategoryChange = (subCategoryId) => {
        const currentCategories = [...product.categoryIds];
        const mainCategoryId = currentCategories[0];

        const newCategories = mainCategoryId ? [mainCategoryId] : [];
        if (subCategoryId) {
            newCategories.push(subCategoryId);
        }

        setProduct(prev => ({
            ...prev,
            categoryIds: newCategories
        }));
    };

    const getCurrentMainCategory = () => {
        return product.categoryIds.length > 0 ? product.categoryIds[0] : "";
    };

    const getCurrentSubCategory = () => {
        return product.categoryIds.length > 1 ? product.categoryIds[1] : "";
    };

    // Product type handler
    const handleProductTypeChange = (type) => {
        setProduct(prev => ({...prev, type}));
        if (type === "simple") {
            setGeneratedVariants([]);
            setSelectedAttributes([]);
            setAttributeValues({});
        }
    };

    // Image handlers
    const onThumbChange = (e) => {
        const file = e.target.files?.[0] || null;
        setThumbnailFile(file);
        setThumbPreview(file ? URL.createObjectURL(file) : "");
    };

    const onImagesChange = (e) => {
        const files = Array.from(e.target.files || []);
        setImageFiles(files);
        setImagePreviews(files.map((f) => URL.createObjectURL(f)));
    };

    const removeThumbnail = () => {
        if (thumbPreview) URL.revokeObjectURL(thumbPreview);
        setThumbPreview("");
        setThumbnailFile(null);
        setExistingThumbnail("");
    };

    const removeImageAt = (index) => {
        setImageFiles((prev) => prev.filter((_, i) => i !== index));
        setImagePreviews((prev) => {
            const toRemove = prev[index];
            if (toRemove) URL.revokeObjectURL(toRemove);
            return prev.filter((_, i) => i !== index);
        });
    };

    const removeExistingImage = (index) => {
        setExistingImages(prev => prev.filter((_, i) => i !== index));
    };

    // Cleanup URLs on unmount
    useEffect(() => {
        return () => {
            if (thumbPreview) URL.revokeObjectURL(thumbPreview);
            imagePreviews.forEach((src) => URL.revokeObjectURL(src));
        };
    }, [thumbPreview, imagePreviews]);

    // Form data builder
    const buildFormData = () => {
        const fd = new FormData();

        // Required fields
        fd.append("title", (product.title || "").trim());
        fd.append("sku", String(product.sku || "").trim());
        fd.append("type", product.type || "simple");
        fd.append("status", product.status.toString());
        fd.append("isFeatured", product.isFeatured.toString());

        // Optional fields
        if (product.slug) fd.append("slug", String(product.slug).trim());
        if (product.description) fd.append("description", String(product.description).trim());
        if (product.brandId) fd.append("brandId", product.brandId);

        // Categories as array
        product.categoryIds.forEach(categoryId => {
            if (categoryId) fd.append("categoryIds", categoryId);
        });

        // Tags as array
        selectedTags.forEach(tagId => {
            if (tagId) fd.append("tags", tagId);
        });

        // Add pricing data for simple products
        if (product.type === "simple" && priceForm.basePrice) {
            fd.append("basePrice", priceForm.basePrice);
            fd.append("discountType", priceForm.discountType);
            fd.append("discountValue", priceForm.discountValue);
            fd.append("currency", priceForm.currency);

            // Add initial stock for simple products
            if (initialStock > 0) {
                fd.append("stock", initialStock.toString());
            }
        }

        // Add variants data for variant products
        if (product.type === "variant" && generatedVariants.length > 0) {
            generatedVariants.forEach((variant, index) => {
                const attributes = Array.isArray(variant.attributes) ? variant.attributes : [];

                const variantData = {
                    sku: variant.sku,
                    attributes: attributes,
                    price: variant.price,
                    compareAtPrice: variant.compareAtPrice,
                    stock: variant.stock,
                    barcode: variant.barcode,
                    status: variant.status,
                    basePrice: variant.price,
                    discountType: "percent",
                    discountValue: 0,
                    currency: priceForm.currency
                };

                // Append each variant as variants[index][field]
                Object.keys(variantData).forEach(key => {
                    if (variantData[key] !== undefined && variantData[key] !== null) {
                        if (key === 'attributes') {
                            fd.append(`variants[${index}][${key}]`, JSON.stringify(variantData[key]));
                        } else {
                            fd.append(`variants[${index}][${key}]`, variantData[key]);
                        }
                    }
                });
            });
        }

        // Images
        if (thumbnailFile) fd.append("thumbnail", thumbnailFile);
        imageFiles.forEach(file => fd.append("images", file));

        // Append existing images that haven't been removed
        existingImages.forEach((img) => fd.append("existingImages", img));

        // Shipping
        if (shippingForm.class) {
            const shippingPayload = {
                class: shippingForm.class === "Custom" && shippingForm.customClassName?.trim()
                    ? shippingForm.customClassName.trim()
                    : shippingForm.class,
                cost: shippingForm.class === "Free Shipping" ? 0 : Number(shippingForm.cost || 0),
                estimated: (shippingForm.estimated || "").trim()
            };
            fd.append("shipping", JSON.stringify(shippingPayload));
        }

        return fd;
    };

    // Variant generation
    const generateVariants = async () => {
        if (!product.sku) {
            toast.error("Please enter product SKU first");
            return;
        }

        setIsGeneratingVariants(true);
        try {
            const selectedAttrs = attributes.filter(attr => selectedAttributes.includes(attr.id));

            const valuesList = selectedAttrs.map(attr => {
                const values = attributeValues[attr.id] || [];
                return values.map(value => ({
                    name: attr.name,
                    value: typeof value === 'object' ? value.value : value
                }));
            });

            if (valuesList.length === 0 || valuesList.some(arr => arr.length === 0)) {
                toast.error("Please select values for all attributes");
                return;
            }

            // Generate cartesian product
            const cartesian = (...arrays) => arrays.reduce((acc, curr) =>
                acc.flatMap(a => curr.map(c => [...a, c])), [[]]);

            const combinations = cartesian(...valuesList);
            const generatedVariantsList = [];

            combinations.forEach(combo => {
                const variantAttributes = combo.flat();
                const variantSuffix = variantAttributes
                    .map(attr => attr.value)
                    .join('-')
                    .toLowerCase()
                    .replace(/\s+/g, '-');

                const variantSku = `${product.sku}-${variantSuffix}`.substring(0, 50);
                const basePrice = Number(priceForm.basePrice || 0);

                const variantData = {
                    sku: variantSku,
                    attributes: variantAttributes,
                    price: basePrice,
                    compareAtPrice: basePrice * 1.2,
                    stock: 0,
                    barcode: `${product.sku}-${variantSuffix}`.substring(0, 50),
                    status: true,
                    displayAttributes: variantAttributes.map(attr => `${attr.name}: ${attr.value}`).join(', '),
                    tempId: Date.now() + Math.random().toString(36).substr(2, 9)
                };

                generatedVariantsList.push(variantData);
            });

            setGeneratedVariants(generatedVariantsList);
            toast.success(`${generatedVariantsList.length} variants generated successfully!`);
        } catch (error) {
            console.error("Variant generation error:", error);
            toast.error("Failed to generate variants");
        } finally {
            setIsGeneratingVariants(false);
        }
    };

    // Variant management
    const updateVariantStock = (tempId, newStock) => {
        setGeneratedVariants(prev => prev.map(variant =>
            variant.tempId === tempId ? {...variant, stock: Number(newStock)} : variant
        ));
    };

    const updateVariantPrice = (tempId, newPrice) => {
        setGeneratedVariants(prev => prev.map(variant =>
            variant.tempId === tempId ? {
                ...variant,
                price: Number(newPrice),
                basePrice: Number(newPrice)
            } : variant
        ));
    };

    const updateVariantStatus = (tempId, newStatus) => {
        setGeneratedVariants(prev => prev.map(variant =>
            variant.tempId === tempId ? {...variant, status: newStatus} : variant
        ));
    };

    const deleteVariant = async (tempId) => {
        const variant = generatedVariants.find(v => v.tempId === tempId);

        // If variant exists in database, delete it from there too
        if (variant?.variantId) {
            try {
                await variantsApi.deleteVariant(variant.variantId);
                toast.success("Variant deleted from database");
            } catch (error) {
                console.error("Error deleting variant from database:", error);
                toast.error("Failed to delete variant from database");
                return;
            }
        }

        setGeneratedVariants(prev => prev.filter(variant => variant.tempId !== tempId));
        toast.success("Variant removed");
    };

    // FAQ functions
    const addFaq = () => setFaqs([...faqs, {question: "", answer: ""}]);
    const removeFaq = (index) => setFaqs(faqs.filter((_, i) => i !== index));

    const createProductFaqs = async () => {
        const validFaqs = faqs.filter(f => f.question.trim() && f.answer.trim());
        if (validFaqs.length === 0) return;

        try {
            // Delete existing FAQs
            try {
                const existingFaqs = await faqApi.getProductFaqs(id);
                let faqsToDelete = [];

                if (Array.isArray(existingFaqs?.data)) {
                    faqsToDelete = existingFaqs.data;
                } else if (Array.isArray(existingFaqs?.data?.items)) {
                    faqsToDelete = existingFaqs.data.items;
                } else if (Array.isArray(existingFaqs?.items)) {
                    faqsToDelete = existingFaqs.items;
                }

                for (const faq of faqsToDelete) {
                    await faqApi.deleteFaq(faq._id || faq.id);
                }
            } catch (error) {
                console.error("Error deleting existing FAQs:", error);
            }

            // Create new FAQs
            for (const faq of validFaqs) {
                await faqApi.createFaq({
                    productId: id,
                    question: faq.question.trim(),
                    answer: faq.answer.trim()
                });
            }
            toast.success("FAQs saved successfully");
        } catch (error) {
            console.error("Error saving FAQs:", error);
            toast.error("Failed to save FAQs");
        }
    };

    // SEO functions
    const createProductSeo = async () => {
        if (!seoForm.metaTitle && !seoForm.metaDescription && !seoForm.keywords) return;

        try {
            const payload = {
                metaTitle: seoForm.metaTitle || "",
                metaDescription: seoForm.metaDescription || "",
                keywords: String(seoForm.keywords || "").split(",").map((k) => k.trim()).filter(Boolean),
                canonicalUrl: "",
                slug: seoForm.slug || product.slug || "",
            };
            await seoService.updateSeo(id, payload);
            toast.success("SEO data saved successfully");
        } catch (error) {
            console.error("Error saving SEO:", error);
            toast.error("Failed to save SEO data");
        }
    };

    // Stock functions
    const handleAddStock = async () => {
        if (!stockForm.quantity || stockForm.quantity <= 0) {
            toast.error("Please enter a valid quantity");
            return;
        }

        try {
            await stockApi.createStockLog({
                productId: id,
                type: stockForm.type,
                quantity: Number(stockForm.quantity),
                source: "manual",
                note: stockForm.note || `${stockForm.type === 'in' ? 'Stock added' : 'Stock removed'} manually`
            });

            toast.success(`Stock ${stockForm.type === 'in' ? 'added' : 'removed'} successfully`);
            setStockForm({quantity: "", type: "in", note: ""});
            await fetchStockLogs(id);
        } catch (error) {
            console.error("Error adding stock:", error);
            toast.error("Failed to update stock");
        }
    };

    // Save generated variants
    const saveGeneratedVariants = async () => {
        if (generatedVariants.length === 0) return;

        try {
            let savedCount = 0;
            let updatedCount = 0;

            for (const variant of generatedVariants) {
                const variantData = {
                    productId: id,
                    sku: variant.sku,
                    attributes: variant.attributes,
                    price: variant.price,
                    compareAtPrice: variant.compareAtPrice,
                    stock: variant.stock,
                    barcode: variant.barcode,
                    status: variant.status !== false
                };

                // If variant has an ID, update it; otherwise create new
                if (variant.variantId) {
                    await variantsApi.updateVariant(variant.variantId, variantData);
                    updatedCount++;
                } else {
                    await variantsApi.createVariant(variantData);
                    savedCount++;
                }
            }

            let message = "";
            if (savedCount > 0) message += `${savedCount} variants created. `;
            if (updatedCount > 0) message += `${updatedCount} variants updated. `;

            toast.success(message.trim() || "Variants processed successfully!");
        } catch (error) {
            console.error("Error saving variants:", error);
            toast.error("Failed to save some variants");
        }
    };

    // Validation
    const canPublish = product.title?.trim() && product.sku?.trim() && product.type;

    // Shipping validation
    const validateShipping = () => {
        if (!shippingForm.class) {
            toast.error("Shipping class is required");
            return false;
        }
        if (shippingForm.class !== "Free Shipping") {
            if (shippingForm.cost === "" || Number(shippingForm.cost) < 0) {
                toast.error("Shipping cost must be a non-negative number");
                return false;
            }
        }
        if ((shippingForm.estimated || "").length > 40) {
            toast.error("Estimated delivery must be 40 characters or less");
            return false;
        }
        return true;
    };

    // Publish product function
    const handlePublish = async () => {
        if (!canPublish) {
            toast.error("Please fill all required fields");
            return;
        }

        if (product.type === "variant" && generatedVariants.length === 0) {
            toast.error("Please generate variants for variant products");
            return;
        }

        if (!validateShipping()) {
            return;
        }

        setIsSaving(true);
        try {
            // Set product status to true (published)
            const updatedProduct = {...product, status: true};
            setProduct(updatedProduct);

            // Update product with published status
            const fd = buildFormData();
            fd.set("status", "true");

            await productApi.updateProduct(id, fd);

            // Update all variants status to true as well
            if (product.type === "variant" && generatedVariants.length > 0) {
                const updatedVariants = generatedVariants.map(variant => ({
                    ...variant,
                    status: true
                }));
                setGeneratedVariants(updatedVariants);
                await saveGeneratedVariants();
            }

            // Save related data
            await createProductSeo();
            await createProductFaqs();

            toast.success("Product published successfully!");
        } catch (e) {
            console.error("Publish error:", e);
            toast.error(e?.response?.data?.message || e?.message || "Failed to publish product");
        } finally {
            setIsSaving(false);
        }
    };

    // Main save function
    const handleSave = async () => {
        if (!product.title?.trim()) {
            toast.error("Product title is required");
            return;
        }


        if (product.type === "variant" && generatedVariants.length === 0) {
            toast.error("Please generate variants for variant products");
            return;
        }

        if (!validateShipping()) {
            return;
        }

        setIsSaving(true);
        try {
            const fd = buildFormData();
            await productApi.updateProduct(id, fd);

            // Save related data based on product type
            if (product.type === "variant" && generatedVariants.length > 0) {
                await saveGeneratedVariants();
            }

            await createProductSeo();
            await createProductFaqs();

            toast.success("Product updated successfully!");
        } catch (e) {
            console.error("Save error:", e);
            toast.error(e?.response?.data?.message || e?.message || "Failed to update product");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
            <MasterLayout>
                <Breadcrumb title="Catalog / Products"/>
                <div className="card h-100 p-0 radius-12">
                    <div className="card-body p-24">Loading product data...</div>
                </div>
            </MasterLayout>
        );
    }


    return (
        <MasterLayout>
            <Breadcrumb title={`Catalog / Products / ${product.title || "Edit Product"}`}/>

            <div className="container-fluid">
                {/* Action Bar */}
                <div className="d-flex justify-content-end gap-2 py-3">
                    <button className="btn btn-outline-secondary" onClick={() => navigate("/products")}>
                        Back to Products
                    </button>
                    {!product.status && (
                        <button
                            className="btn btn-success"
                            disabled={isSaving}
                            onClick={handlePublish}
                        >
                            {isSaving ? "Publishing..." : "Publish Product"}
                        </button>
                    )}
                    <button className="btn btn-primary" disabled={isSaving} onClick={handleSave}>
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>

                {/* Product Status Badge */}
                <div className="row mb-3">
                    <div className="col-12">
                        <div
                            className={`alert ${product.status ? 'alert-success' : 'alert-warning'} d-flex align-items-center justify-content-between`}>
                            <div>
                                <strong>Product Status:</strong>
                                <span className={`badge ${product.status ? 'bg-success' : 'bg-warning'} ms-2`}>
                                    {product.status ? 'Published' : 'Draft'}
                                </span>
                            </div>
                            {!product.status && (
                                <small className="text-muted">
                                    Click "Publish Product" to make this product visible to customers
                                </small>
                            )}
                        </div>
                    </div>
                </div>

                <div className="row">
                    {/* Left Column - Product Information */}
                    <div className="col-12 col-lg-6">
                        <div className="card mb-4">
                            <div
                                className="card-header py-3 bg-base border-0 d-flex justify-content-between align-items-center">
                                <h6 className="text-lg mb-0">Product Information</h6>
                                <div className="form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        checked={product.status}
                                        onChange={(e) => setProduct({...product, status: e.target.checked})}
                                    />
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-12">
                                        <div className="mb-3">
                                            <label className="form-label">Product Title *</label>
                                            <input
                                                className="form-control"
                                                value={product.title}
                                                onChange={(e) => setProduct({...product, title: e.target.value})}
                                                placeholder="Enter product title"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Slug</label>
                                            <input
                                                className="form-control"
                                                value={product.slug}
                                                onChange={(e) => setProduct({...product, slug: e.target.value})}
                                                placeholder="Enter Slug"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">SKU *</label>
                                            <input
                                                className="form-control"
                                                value={product.sku}
                                                onChange={(e) => setProduct({...product, sku: e.target.value})}
                                                placeholder="Enter SKU"
                                            />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Product Type</label>
                                            <select
                                                className="form-select"
                                                value={product.type}
                                                onChange={(e) => handleProductTypeChange(e.target.value)}
                                            >
                                                <option value="simple">Simple Product</option>
                                                <option value="variant">Variant Product</option>
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Description</label>
                                            <textarea
                                                className="form-control"
                                                rows={6}
                                                value={product.description}
                                                onChange={(e) => setProduct({...product, description: e.target.value})}
                                                placeholder="Enter product description"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Image Upload Section */}
                        <div className="card mb-4">
                            <div className="card-header py-3 bg-base border-0">
                                <h6 className="text-lg mb-0">Product Images</h6>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Thumbnail Image</label>
                                            <input
                                                type="file"
                                                className="form-control"
                                                accept="image/*"
                                                onChange={onThumbChange}
                                            />
                                            {(thumbPreview || existingThumbnail) && (
                                                <div className="d-flex align-items-center gap-2 mt-2">
                                                    <img
                                                        src={thumbPreview || `http://localhost:8000${existingThumbnail}`}
                                                        alt="Thumbnail preview"
                                                        style={{
                                                            width: 80,
                                                            height: 80,
                                                            objectFit: "cover",
                                                            borderRadius: 8
                                                        }}
                                                    />
                                                    <button
                                                        type="button"
                                                        className="btn btn-danger btn-sm"
                                                        onClick={removeThumbnail}
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Gallery Images</label>
                                            <input
                                                type="file"
                                                className="form-control"
                                                accept="image/*"
                                                multiple
                                                onChange={onImagesChange}
                                            />
                                            <div className="d-flex gap-2 flex-wrap mt-2">
                                                {/* New image previews */}
                                                {imagePreviews.map((preview, index) => (
                                                    <div key={`new-${index}`} className="position-relative">
                                                        <img
                                                            src={preview}
                                                            alt={`Preview ${index}`}
                                                            style={{
                                                                width: 60,
                                                                height: 60,
                                                                objectFit: "cover",
                                                                borderRadius: 6
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-danger position-absolute"
                                                            style={{top: -5, right: -5}}
                                                            onClick={() => removeImageAt(index)}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                                {/* Existing images */}
                                                {existingImages.map((image, index) => (
                                                    <div key={`existing-${index}`} className="position-relative">
                                                        <img
                                                            src={`${process.env.REACT_APP_API_BASE_URL}${image}`}
                                                            alt={`Existing ${index}`}
                                                            style={{
                                                                width: 60,
                                                                height: 60,
                                                                objectFit: "cover",
                                                                borderRadius: 6
                                                            }}
                                                        />
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-danger position-absolute"
                                                            style={{top: -5, right: -5}}
                                                            onClick={() => removeExistingImage(index)}
                                                        >
                                                            ×
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Pricing & Classification */}
                    <div className="col-12 col-lg-6">

                        {/* Variant Base Price - Show only for variant products */}
                        {product.type === "variant" && (
                            <div className="card mb-4">
                                <div className="card-header py-3 bg-base border-0">
                                    <h6 className="text-lg mb-0">Variant Base Pricing</h6>
                                </div>
                                <div className="card-body">
                                    <div className="alert alert-info">
                                        <small>
                                            This base price will be used as the default for all generated variants.
                                            You can customize individual variant prices after generation.
                                        </small>
                                    </div>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Base Price</label>
                                                <input
                                                    type="number"
                                                    className="form-control"
                                                    value={priceForm.basePrice}
                                                    onChange={(e) => setPriceForm({
                                                        ...priceForm,
                                                        basePrice: e.target.value
                                                    })}
                                                    placeholder="0.00"
                                                    step="0.01"
                                                    min="0"
                                                />
                                                <div className="form-text">Default price for variants</div>
                                            </div>
                                        </div>
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Currency</label>
                                                <select
                                                    className="form-select"
                                                    value={priceForm.currency}
                                                    onChange={(e) => setPriceForm({
                                                        ...priceForm,
                                                        currency: e.target.value
                                                    })}
                                                >
                                                    <option value="USD">USD</option>
                                                    <option value="INR">INR</option>
                                                    <option value="EUR">EUR</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Categories & Brands */}
                        <div className="card mb-4">
                            <div className="card-header py-3 bg-base border-0">
                                <h6 className="text-lg mb-0">Classification</h6>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Main Category</label>
                                            <div className="d-flex gap-2">
                                                <select
                                                    className="form-select"
                                                    value={getCurrentMainCategory()}
                                                    onChange={(e) => handleMainCategoryChange(e.target.value)}
                                                >
                                                    <option value="">Select Category</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary"
                                                    onClick={openCategoryModal}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Sub Category</label>
                                            <select
                                                className="form-select"
                                                value={getCurrentSubCategory()}
                                                onChange={(e) => handleSubCategoryChange(e.target.value)}
                                                disabled={!getCurrentMainCategory() || loadingSubCategories}
                                            >
                                                <option value="">Select Sub Category</option>
                                                {loadingSubCategories ? (
                                                    <option value="" disabled>Loading subcategories...</option>
                                                ) : (
                                                    subCategories.map(sub => (
                                                        <option key={sub.id} value={sub.id}>{sub.name}</option>
                                                    ))
                                                )}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="mb-3">
                                            <label className="form-label">Brand</label>
                                            <div className="d-flex gap-2">
                                                <select
                                                    className="form-select"
                                                    value={product.brandId}
                                                    onChange={(e) => setProduct({...product, brandId: e.target.value})}
                                                >
                                                    <option value="">Select Brand</option>
                                                    {brands.map(brand => (
                                                        <option key={brand.id} value={brand.id}>{brand.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-primary"
                                                    onClick={openBrandModal}
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="col-12">
                                        <div className="mb-3">
                                            <label className="form-label">Product Tags</label>
                                            <CreatableSelect
                                                isMulti
                                                options={tagOptions}
                                                value={selectedTagOptions}
                                                onChange={handleTagChange}
                                                onCreateOption={handleCreateTag}
                                                placeholder="Search or create tags..."
                                                className="react-select-container"
                                                classNamePrefix="react-select"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Shipping Information */}
                        <div className="card mb-4">
                            <div className="card-header py-3 bg-base border-0">
                                <h6 className="text-lg mb-0">Shipping Information</h6>
                            </div>
                            <div className="card-body">
                                <div className="row">
                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Shipping Class *</label>
                                            <select
                                                className="form-select"
                                                value={shippingForm.class}
                                                onChange={(e) => setShippingForm({
                                                    ...shippingForm,
                                                    class: e.target.value
                                                })}
                                            >
                                                <option value="">Select Shipping Class</option>
                                                <option value="Standard">Standard</option>
                                                <option value="Express">Express</option>
                                                <option value="Heavy">Heavy</option>
                                                <option value="Fragile">Fragile</option>
                                                <option value="Free Shipping">Free Shipping</option>
                                                <option value="Custom">Custom</option>
                                            </select>
                                        </div>
                                    </div>

                                    {shippingForm.class === "Custom" && (
                                        <div className="col-md-6">
                                            <div className="mb-3">
                                                <label className="form-label">Custom Shipping Class Name</label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    value={shippingForm.customClassName}
                                                    onChange={(e) => setShippingForm({
                                                        ...shippingForm,
                                                        customClassName: e.target.value
                                                    })}
                                                    placeholder="Enter custom class name"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Shipping
                                                Cost {shippingForm.class !== "Free Shipping" ? "*" : ""}</label>
                                            <input
                                                type="number"
                                                className="form-control"
                                                value={shippingForm.class === "Free Shipping" ? 0 : shippingForm.cost}
                                                onChange={(e) => setShippingForm({
                                                    ...shippingForm,
                                                    cost: e.target.value
                                                })}
                                                placeholder="0"
                                                step="0.01"
                                                min="0"
                                                disabled={shippingForm.class === "Free Shipping"}
                                            />
                                            {shippingForm.class === "Free Shipping" && (
                                                <div className="form-text">Cost is 0 for Free Shipping</div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <div className="mb-3">
                                            <label className="form-label">Estimated Delivery Time</label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                value={shippingForm.estimated}
                                                onChange={(e) => setShippingForm({
                                                    ...shippingForm,
                                                    estimated: e.target.value
                                                })}
                                                placeholder="e.g., 3–5 days"
                                                maxLength={40}
                                            />
                                            <div className="form-text">Max 40 characters</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Vertical Tabs Section */}
                    <div className="col-12">
                        <div className="card p-0 overflow-hidden position-relative radius-12">
                            <div className="card-header py-3 bg-base border border-end-0 border-start-0 border-top-0">
                                <h6 className="text-lg mb-0">Advanced Settings</h6>
                            </div>
                            <div className="card-body p-0">
                                <div className="d-flex align-items-start">
                                    {/* Vertical Tabs Navigation */}
                                    <ul className="nav button-tab nav-pills flex-column border-end"
                                        style={{minWidth: "200px"}} role="tablist">
                                        {[
                                            {id: "attributes", label: "Attributes"},
                                            {id: "faqs", label: "Product FAQs"},
                                            {id: "seo", label: "SEO"},
                                            {id: "stock", label: "Stock"},
                                        ].map((tab) => (
                                            <li className="nav-item w-100" key={tab.id} role="presentation">
                                                <button
                                                    className={`nav-link fw-semibold text-primary-light radius-0 px-16 py-12 w-100 text-start border-0 ${activeTab === tab.id ? "active" : ""}`}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    type="button"
                                                    role="tab"
                                                >
                                                    {tab.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>

                                    {/* Tab Content */}
                                    <div className="tab-content flex-grow-1 p-24" style={{minHeight: "400px"}}>
                                        {/* Attributes Tab */}
                                        {activeTab === "attributes" && (
                                            <div className="tab-pane fade show active">
                                                <h6 className="text-lg mb-16">Product Attributes</h6>
                                                <div className="mb-3">
                                                    <label className="form-label">Select Attributes and Values</label>
                                                    <div className="d-flex flex-wrap gap-3">
                                                        {attributes.map((attr) => (
                                                            <div key={attr.id} className="border rounded p-3"
                                                                 style={{minWidth: "300px"}}>
                                                                <label className="d-flex align-items-center mb-3">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="form-check-input me-2"
                                                                        checked={selectedAttributes.includes(attr.id)}
                                                                        onChange={() => handleAttributeToggle(attr.id)}
                                                                    />
                                                                    <strong className="fs-6">{attr.name}</strong>
                                                                </label>
                                                                {selectedAttributes.includes(attr.id) && (
                                                                    <div className="mt-2">
                                                                        <label className="form-label small mb-2">Select
                                                                            Values</label>
                                                                        <Select
                                                                            isMulti
                                                                            options={getAttributeValuesOptions(attr.id)}
                                                                            value={getSelectedAttributeValues(attr.id)}
                                                                            onChange={(selected) => handleAttributeValuesChange(attr.id, selected)}
                                                                            placeholder={`Select ${attr.name} values...`}
                                                                            className="react-select-container"
                                                                            classNamePrefix="react-select"
                                                                        />
                                                                        <div className="form-text small mt-1">
                                                                            Select one or more values for this attribute
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Variant Generation Section */}
                                                {product.type === "variant" && selectedAttributes.length > 0 && (
                                                    <div className="border rounded p-4 mt-4 bg-light">
                                                        <h6 className="mb-3">Variant Generation</h6>
                                                        <div className="row">
                                                            <div className="col-md-8">
                                                                <p className="text-muted mb-3">
                                                                    Selected
                                                                    attributes: {selectedAttributes.map(attrId => {
                                                                    const attr = attributes.find(a => a.id === attrId);
                                                                    return attr?.name;
                                                                }).join(', ')}
                                                                </p>
                                                                <p className="text-muted mb-3">
                                                                    Total variants to generate: {
                                                                    selectedAttributes.reduce((total, attrId) => {
                                                                        const values = attributeValues[attrId] || [];
                                                                        return total * (values.length || 1);
                                                                    }, 1)
                                                                }
                                                                </p>
                                                            </div>
                                                            <div className="col-md-4 text-end">
                                                                <button
                                                                    className="btn btn-primary"
                                                                    onClick={generateVariants}
                                                                    disabled={isGeneratingVariants || selectedAttributes.some(attrId =>
                                                                        !attributeValues[attrId] || attributeValues[attrId].length === 0
                                                                    )}
                                                                >
                                                                    {isGeneratingVariants ? "Generating..." : "Generate Variants"}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Generated Variants Display */}
                                                {generatedVariants.length > 0 && (
                                                    <div className="mt-4">
                                                        <h6 className="mb-3">Generated Variants
                                                            ({generatedVariants.length})</h6>
                                                        <div className="alert alert-info">
                                                            <small>
                                                                These variants will be saved to the database when you
                                                                publish or save the product.
                                                                You can edit prices and stock levels before saving.
                                                            </small>
                                                        </div>
                                                        <div className="table-responsive">
                                                            <table className="table table-striped">
                                                                <thead>
                                                                <tr>
                                                                    <th>SKU</th>
                                                                    <th>Attributes</th>
                                                                    <th>Price</th>
                                                                    <th>Stock</th>
                                                                    <th>Status</th>
                                                                    <th>Barcode</th>
                                                                    <th>Actions</th>
                                                                </tr>
                                                                </thead>
                                                                <tbody>
                                                                {generatedVariants.map((variant, index) => (
                                                                    <tr key={variant.tempId}>
                                                                        <td>
                                                                            <strong>{variant.sku}</strong>
                                                                        </td>
                                                                        <td>
                                                                            <small>{variant.displayAttributes}</small>
                                                                        </td>
                                                                        <td>
                                                                            <input
                                                                                type="number"
                                                                                className="form-control form-control-sm"
                                                                                value={variant.price}
                                                                                onChange={(e) => updateVariantPrice(variant.tempId, e.target.value)}
                                                                                step="0.01"
                                                                                min="0"
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <input
                                                                                type="number"
                                                                                className="form-control form-control-sm"
                                                                                value={variant.stock}
                                                                                onChange={(e) => updateVariantStock(variant.tempId, e.target.value)}
                                                                                min="0"
                                                                            />
                                                                        </td>
                                                                        <td>
                                                                            <div className="form-check form-switch">
                                                                                <input
                                                                                    className="form-check-input"
                                                                                    type="checkbox"
                                                                                    checked={variant.status}
                                                                                    onChange={(e) => updateVariantStatus(variant.tempId, e.target.checked)}
                                                                                />
                                                                            </div>
                                                                        </td>
                                                                        <td>
                                                                            <small>{variant.barcode}</small>
                                                                        </td>
                                                                        <td>
                                                                            <button
                                                                                className="btn btn-outline-danger btn-sm"
                                                                                onClick={() => deleteVariant(variant.tempId)}
                                                                            >
                                                                                Remove
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* FAQs Tab */}
                                        {activeTab === "faqs" && (
                                            <div className="tab-pane fade show active">
                                                <h6 className="text-lg mb-16">Product FAQs</h6>
                                                {faqs.map((faq, index) => (
                                                    <div key={index} className="mb-4 p-3 border rounded">
                                                        <div className="mb-3">
                                                            <label className="form-label">Question</label>
                                                            <input
                                                                className="form-control"
                                                                value={faq.question}
                                                                onChange={(e) => setFaqs(prev =>
                                                                    prev.map((item, i) =>
                                                                        i === index ? {
                                                                            ...item,
                                                                            question: e.target.value
                                                                        } : item
                                                                    )
                                                                )}
                                                                placeholder="Enter question"
                                                            />
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="form-label">Answer</label>
                                                            <textarea
                                                                className="form-control"
                                                                rows={3}
                                                                value={faq.answer}
                                                                onChange={(e) => setFaqs(prev =>
                                                                    prev.map((item, i) =>
                                                                        i === index ? {
                                                                            ...item,
                                                                            answer: e.target.value
                                                                        } : item
                                                                    )
                                                                )}
                                                                placeholder="Enter answer"
                                                            />
                                                        </div>
                                                        {faqs.length > 1 && (
                                                            <button
                                                                className="btn btn-outline-danger btn-sm"
                                                                onClick={() => removeFaq(index)}
                                                            >
                                                                Remove FAQ
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button className="btn btn-outline-primary" onClick={addFaq}>
                                                    Add FAQ
                                                </button>
                                            </div>
                                        )}

                                        {/* SEO Tab */}
                                        {activeTab === "seo" && (
                                            <div className="tab-pane fade show active">
                                                <h6 className="text-lg mb-16">Search Engine Optimization</h6>
                                                <div className="row">
                                                    <div className="col-12">
                                                        <div className="mb-3">
                                                            <label className="form-label">Meta Title</label>
                                                            <input
                                                                className="form-control"
                                                                value={seoForm.metaTitle}
                                                                onChange={(e) => setSeoForm({
                                                                    ...seoForm,
                                                                    metaTitle: e.target.value
                                                                })}
                                                                placeholder="Enter meta title"
                                                            />
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="form-label">Meta Description</label>
                                                            <textarea
                                                                className="form-control"
                                                                rows={3}
                                                                value={seoForm.metaDescription}
                                                                onChange={(e) => setSeoForm({
                                                                    ...seoForm,
                                                                    metaDescription: e.target.value
                                                                })}
                                                                placeholder="Enter meta description"
                                                            />
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="form-label">Keywords</label>
                                                            <input
                                                                className="form-control"
                                                                value={seoForm.keywords}
                                                                onChange={(e) => setSeoForm({
                                                                    ...seoForm,
                                                                    keywords: e.target.value
                                                                })}
                                                                placeholder="Enter keywords (comma separated)"
                                                            />
                                                        </div>
                                                        <div className="mb-3">
                                                            <label className="form-label">Slug</label>
                                                            <input
                                                                className="form-control"
                                                                value={seoForm.slug}
                                                                onChange={(e) => setSeoForm({
                                                                    ...seoForm,
                                                                    slug: e.target.value
                                                                })}
                                                                placeholder="Enter URL slug"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Stock Tab */}
                                        {activeTab === "stock" && (
                                            <div className="tab-pane fade show active">
                                                <h6 className="text-lg mb-16">Stock Management</h6>
                                                <div className="row">
                                                    <div className="col-12">
                                                        <div className="card mb-4">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Add Stock</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                <div className="row">
                                                                    <div className="col-md-3">
                                                                        <div className="mb-3">
                                                                            <label className="form-label">Quantity
                                                                                *</label>
                                                                            <input
                                                                                type="number"
                                                                                className="form-control"
                                                                                value={stockForm.quantity}
                                                                                onChange={(e) => setStockForm({
                                                                                    ...stockForm,
                                                                                    quantity: e.target.value
                                                                                })}
                                                                                placeholder="Enter quantity"
                                                                                min="1"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-3">
                                                                        <div className="mb-3">
                                                                            <label className="form-label">Type</label>
                                                                            <select
                                                                                className="form-select"
                                                                                value={stockForm.type}
                                                                                onChange={(e) => setStockForm({
                                                                                    ...stockForm,
                                                                                    type: e.target.value
                                                                                })}
                                                                            >
                                                                                <option value="in">Stock In</option>
                                                                                <option value="out">Stock Out</option>
                                                                            </select>
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-4">
                                                                        <div className="mb-3">
                                                                            <label className="form-label">Note</label>
                                                                            <input
                                                                                type="text"
                                                                                className="form-control"
                                                                                value={stockForm.note}
                                                                                onChange={(e) => setStockForm({
                                                                                    ...stockForm,
                                                                                    note: e.target.value
                                                                                })}
                                                                                placeholder="Optional note"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div className="col-md-2">
                                                                        <div className="mb-3">
                                                                            <label className="form-label">&nbsp;</label>
                                                                            <button
                                                                                className="btn btn-primary w-100"
                                                                                onClick={handleAddStock}
                                                                                disabled={!stockForm.quantity || stockForm.quantity <= 0}
                                                                            >
                                                                                Add Stock
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="card">
                                                            <div className="card-header">
                                                                <h6 className="mb-0">Stock History</h6>
                                                            </div>
                                                            <div className="card-body">
                                                                {stockLogs.length === 0 ? (
                                                                    <p className="text-muted">No stock records found</p>
                                                                ) : (
                                                                    <div className="table-responsive">
                                                                        <table className="table table-striped">
                                                                            <thead>
                                                                            <tr>
                                                                                <th>Date</th>
                                                                                <th>Type</th>
                                                                                <th>Quantity</th>
                                                                                <th>Source</th>
                                                                                <th>Note</th>
                                                                            </tr>
                                                                            </thead>
                                                                            <tbody>
                                                                            {stockLogs.map((log, index) => (
                                                                                <tr key={index}>
                                                                                    <td>{new Date(log.createdAt || log.date).toLocaleDateString()}</td>
                                                                                    <td>
                                                                                        <span
                                                                                            className={`badge ${log.type === 'in' ? 'bg-success' : 'bg-danger'}`}>
                                                                                            {log.type?.toUpperCase()}
                                                                                        </span>
                                                                                    </td>
                                                                                    <td>{log.quantity}</td>
                                                                                    <td>{log.source}</td>
                                                                                    <td>{log.note || '-'}</td>
                                                                                </tr>
                                                                            ))}
                                                                            </tbody>
                                                                        </table>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Modal */}
                {showCategoryModal && (
                    <div className="modal fade show"
                         style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Add New Category</h5>
                                    <button type="button" className="btn-close"
                                            onClick={closeCategoryModal}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Category Name *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newCategory.name}
                                            onChange={(e) => setNewCategory({
                                                ...newCategory,
                                                name: e.target.value
                                            })}
                                            placeholder="Enter category name"
                                        />
                                    </div>
                                    <div className="mb-3">
                                        <label className="form-label">Parent Category
                                            (Optional)</label>
                                        <select
                                            className="form-select"
                                            value={newCategory.parentId}
                                            onChange={(e) => setNewCategory({
                                                ...newCategory,
                                                parentId: e.target.value
                                            })}
                                        >
                                            <option value="">No Parent (Main Category)</option>
                                            {categories.map(cat => (
                                                <option key={cat.id}
                                                        value={cat.id}>{cat.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary"
                                            onClick={closeCategoryModal}>
                                        Cancel
                                    </button>
                                    <button type="button" className="btn btn-primary"
                                            onClick={handleCreateCategory}>
                                        Create Category
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Brand Modal */}
                {showBrandModal && (
                    <div className="modal fade show"
                         style={{display: 'block', backgroundColor: 'rgba(0,0,0,0.5)'}}>
                        <div className="modal-dialog">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Add New Brand</h5>
                                    <button type="button" className="btn-close"
                                            onClick={closeBrandModal}></button>
                                </div>
                                <div className="modal-body">
                                    <div className="mb-3">
                                        <label className="form-label">Brand Name *</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={newBrand.name}
                                            onChange={(e) => setNewBrand({
                                                ...newBrand,
                                                name: e.target.value
                                            })}
                                            placeholder="Enter brand name"
                                        />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary"
                                            onClick={closeBrandModal}>
                                        Cancel
                                    </button>
                                    <button type="button" className="btn btn-primary"
                                            onClick={handleCreateBrand}>
                                        Create Brand
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <ToastContainer/>
            </div>
        </MasterLayout>
    );
};

export default ProductDetailsPage;