"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import styles from "./page.module.css";

type Category = {
  category_id: number | string;
  name: string;
  image: string | null;
};

type Product = {
  id: number;
  name: string;
  image: string | null;
  price: number;
  quantity: number;
  sku: string;
};

type ProductDetails = Product & {
  description: string;
  basePrice: number;
  model: string;
  rating: number;
  reviews: number;
  metaTitle: string;
  metaDescription: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function fetchApiData<T>(path: string): Promise<T> {
  const response = await fetch(`/backend-api/${path}`, { cache: "no-store" });
  const payload: unknown = await response.json();

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (!isRecord(payload) || !("data" in payload)) {
    throw new Error("The API returned an unexpected response.");
  }

  return payload.data as T;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number.isFinite(price) ? price : 0);
}

function StoreImage({
  src,
  alt,
  sizes,
}: {
  src: string | null;
  alt: string;
  sizes: string;
}) {
  const imageSrc = src ? (src.startsWith("//") ? `https:${src}` : src) : null;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  return (
    <div className={styles.imageFrame}>
      {imageSrc && failedSrc !== imageSrc ? (
        <Image
          src={imageSrc}
          alt={alt}
          fill
          sizes={sizes}
          unoptimized
          onError={() => setFailedSrc(imageSrc)}
        />
      ) : (
        <div
          className={styles.imageFallback}
          role="img"
          aria-label={`${alt} image unavailable`}
        >
          <span>F / S</span>
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [productDetails, setProductDetails] = useState<ProductDetails | null>(
    null,
  );
  const [search, setSearch] = useState("");
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [categoryRetry, setCategoryRetry] = useState(0);
  const [productRetry, setProductRetry] = useState(0);
  const [detailsRetry, setDetailsRetry] = useState(0);

  useEffect(() => {
    let active = true;

    async function loadCategories() {
      setCategoriesLoading(true);
      setCategoriesError(null);

      try {
        const result = await fetchApiData<Category[]>("categories");
        if (!result.length) {
          throw new Error("No categories are available right now.");
        }
        if (active) {
          setCategories(result);
          setSelectedCategoryId(String(result[0].category_id));
        }
      } catch (error) {
        if (active) setCategoriesError(errorMessage(error));
      } finally {
        if (active) setCategoriesLoading(false);
      }
    }

    void loadCategories();
    return () => {
      active = false;
    };
  }, [categoryRetry]);

  useEffect(() => {
    if (selectedCategoryId === null) return;
    let active = true;

    async function loadProducts() {
      setProductsLoading(true);
      setProductsError(null);
      setProducts([]);

      try {
        const result = await fetchApiData<Product[]>(
          `categories/${encodeURIComponent(selectedCategoryId)}/products`,
        );
        if (active) setProducts(result);
      } catch (error) {
        if (active) setProductsError(errorMessage(error));
      } finally {
        if (active) setProductsLoading(false);
      }
    }

    void loadProducts();
    return () => {
      active = false;
    };
  }, [selectedCategoryId, productRetry]);

  useEffect(() => {
    if (selectedProductId === null) return;
    let active = true;

    async function loadProductDetails() {
      setDetailsLoading(true);
      setDetailsError(null);
      setProductDetails(null);

      try {
        const result = await fetchApiData<ProductDetails>(
          `products/${encodeURIComponent(String(selectedProductId))}`,
        );
        if (active) setProductDetails(result);
      } catch (error) {
        if (active) setDetailsError(errorMessage(error));
      } finally {
        if (active) setDetailsLoading(false);
      }
    }

    void loadProductDetails();
    return () => {
      active = false;
    };
  }, [selectedProductId, detailsRetry]);

  const selectedCategory = categories.find(
    (category) => String(category.category_id) === selectedCategoryId,
  );
  const visibleProducts = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    if (!term) return products;
    return products.filter(
      (product) =>
        product.name.toLocaleLowerCase().includes(term) ||
        product.sku.toLocaleLowerCase().includes(term),
    );
  }, [products, search]);

  function openProduct(product: Product) {
    setSelectedProductId(product.id);
    setProductDetails(null);
    setDetailsError(null);
  }

  function closeProduct() {
    setSelectedProductId(null);
    setProductDetails(null);
    setDetailsError(null);
  }

  useEffect(() => {
    if (selectedProductId === null) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSelectedProductId(null);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedProductId]);

  return (
    <main className={styles.store}>
      <header className={styles.header}>
        <a className={styles.brand} href="#" aria-label="FatherShops home">
          <span className={styles.brandMark}>F</span>
          <span>FATHERSHOPS</span>
        </a>
        <p className={styles.headerNote}>Find your everyday favorite.</p>
        <a className={styles.headerLink} href="#collections">
          Explore the shop <span aria-hidden="true">↘</span>
        </a>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>THE FATHERSHOPS EDIT</p>
          <h1>
            Good finds.
            <br />
            <span>Better days.</span>
          </h1>
          <p className={styles.heroText}>
            Thoughtful picks for your wardrobe, your home, and everything in
            between.
          </p>
          <a className={styles.heroButton} href="#collections">
            Browse collections <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className={styles.heroArt} aria-hidden="true">
          <div className={styles.heroSun} />
          <span className={styles.heroInitial}>F</span>
          <span className={styles.heroSticker}>A LITTLE<br />SOMETHING<br />FOR YOU</span>
          <span className={styles.heroCaption}>CURATED FOR YOUR DAY</span>
        </div>
        <div className={styles.heroIndex} aria-hidden="true">
          <span>01</span>
          <span className={styles.indexLine} />
          <span>04</span>
        </div>
      </section>

      <section className={styles.catalog} id="collections">
        <div className={styles.sectionHeading}>
          <div>
            <p className={styles.eyebrow}>START SOMEWHERE</p>
            <h2>Explore the edit</h2>
          </div>
          <p className={styles.sectionAside}>A good pick is just around the corner.</p>
        </div>

        {categoriesError ? (
          <div className={styles.statePanel} role="alert">
            <p>We couldn&apos;t load the collections.</p>
            <span>{categoriesError}</span>
            <button
              className={styles.textButton}
              onClick={() => setCategoryRetry((attempt) => attempt + 1)}
            >
              Try again
            </button>
          </div>
        ) : categoriesLoading ? (
          <div className={styles.categoryGrid} aria-label="Loading collections">
            {Array.from({ length: 4 }, (_, index) => (
              <div className={styles.categorySkeleton} key={index} />
            ))}
          </div>
        ) : (
          <div className={styles.categoryGrid}>
            {categories.map((category, index) => {
              const isSelected =
                String(category.category_id) === selectedCategoryId;
              return (
                <button
                  className={`${styles.categoryCard} ${isSelected ? styles.categoryCardActive : ""}`}
                  key={category.category_id}
                  onClick={() => {
                    setSelectedCategoryId(String(category.category_id));
                    setSelectedProductId(null);
                  }}
                  aria-pressed={isSelected}
                >
                  <StoreImage
                    src={category.image}
                    alt={category.name}
                    sizes="(max-width: 700px) 44vw, 22vw"
                  />
                  <span className={styles.categoryNumber}>
                    0{index + 1}
                  </span>
                  <span className={styles.categoryName}>{category.name}</span>
                  <span className={styles.categoryArrow} aria-hidden="true">
                    ↗
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className={styles.productHeading}>
          <div>
            <p className={styles.eyebrow}>
              {selectedCategory?.name ?? "THE COLLECTION"}
            </p>
            <h2>Worth a closer look</h2>
          </div>
          <label className={styles.searchBox}>
            <span className={styles.searchIcon} aria-hidden="true">
              ⌕
            </span>
            <input
              type="search"
              placeholder="Search this collection"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              aria-label="Search products"
            />
          </label>
        </div>

        {productsError ? (
          <div className={styles.statePanel} role="alert">
            <p>Products couldn&apos;t be loaded.</p>
            <span>{productsError}</span>
            <button
              className={styles.textButton}
              onClick={() => setProductRetry((attempt) => attempt + 1)}
            >
              Try again
            </button>
          </div>
        ) : productsLoading ? (
          <div className={styles.productGrid} aria-label="Loading products">
            {Array.from({ length: 8 }, (_, index) => (
              <div className={styles.productSkeleton} key={index} />
            ))}
          </div>
        ) : visibleProducts.length ? (
          <div className={styles.productGrid}>
            {visibleProducts.map((product, index) => (
              <article className={styles.productCard} key={product.id}>
                <button
                  className={styles.productImageButton}
                  onClick={() => openProduct(product)}
                  aria-label={`View ${product.name}`}
                >
                  <StoreImage
                    src={product.image}
                    alt={product.name}
                    sizes="(max-width: 600px) 90vw, (max-width: 1000px) 45vw, 23vw"
                  />
                  <span className={styles.productIndex}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.quickView}>Quick view ↗</span>
                </button>
                <div className={styles.productInfo}>
                  <div className={styles.productMeta}>
                    <span>{product.sku || "FATHERSHOPS PICK"}</span>
                    <span>{product.quantity > 0 ? "IN STOCK" : "CHECK AVAILABILITY"}</span>
                  </div>
                  <button
                    className={styles.productTitle}
                    onClick={() => openProduct(product)}
                  >
                    {product.name || "Untitled product"}
                  </button>
                  <p className={styles.productPrice}>{formatPrice(product.price)}</p>
                </div>
              </article>
            ))}
          </div>
        ) : (
          !productsLoading && (
            <div className={styles.emptyState}>
              <span className={styles.emptyMark}>F</span>
              <h3>{search ? "No matches this time." : "Nothing in this collection yet."}</h3>
              <p>
                {search
                  ? "Try a different search, or explore another collection."
                  : "Choose another collection to find something you love."}
              </p>
            </div>
          )
        )}
      </section>

      <footer className={styles.footer}>
        <a className={styles.brand} href="#" aria-label="FatherShops home">
          <span className={styles.brandMark}>F</span>
          <span>FATHERSHOPS</span>
        </a>
        <span>Good things, found.</span>
        <a href="#collections">Back to the top ↑</a>
      </footer>

      {selectedProductId !== null && (
        <div
          className={styles.modalBackdrop}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeProduct();
          }}
        >
          <section
            className={styles.productModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-dialog-title"
          >
            <button
              className={styles.modalClose}
              onClick={closeProduct}
              aria-label="Close product details"
            >
              ×
            </button>
            {detailsError ? (
              <div className={styles.modalState} role="alert">
                <p>We couldn&apos;t load this product.</p>
                <span>{detailsError}</span>
                <button
                  className={styles.heroButton}
                  onClick={() => setDetailsRetry((attempt) => attempt + 1)}
                >
                  Try again
                </button>
              </div>
            ) : detailsLoading || !productDetails ? (
              <div className={styles.modalState} aria-live="polite">
                <span className={styles.loadingDot} />
                <p>Finding the details…</p>
              </div>
            ) : (
              <div className={styles.detailLayout}>
                <div className={styles.detailImage}>
                  <StoreImage
                    src={productDetails.image}
                    alt={productDetails.name}
                    sizes="(max-width: 760px) 90vw, 50vw"
                  />
                </div>
                <div className={styles.detailCopy}>
                  <p className={styles.eyebrow}>A FATHERSHOPS FIND</p>
                  <h2 id="product-dialog-title">{productDetails.name}</h2>
                  <p className={styles.detailPrice}>
                    {formatPrice(productDetails.price)}
                  </p>
                  {productDetails.basePrice > productDetails.price && (
                    <p className={styles.basePrice}>
                      Original price {formatPrice(productDetails.basePrice)}
                    </p>
                  )}
                  <p className={styles.detailDescription}>
                    {productDetails.description || "No description is available for this item."}
                  </p>
                  <div className={styles.specs}>
                    <div>
                      <span>SKU</span>
                      <strong>{productDetails.sku || "—"}</strong>
                    </div>
                    <div>
                      <span>MODEL</span>
                      <strong>{productDetails.model || "—"}</strong>
                    </div>
                    <div>
                      <span>AVAILABILITY</span>
                      <strong>
                        {productDetails.quantity > 0
                          ? `${productDetails.quantity} available`
                          : "Check back soon"}
                      </strong>
                    </div>
                    <div>
                      <span>REVIEWS</span>
                      <strong>
                        {productDetails.rating
                          ? `${productDetails.rating.toFixed(1)} / 5 · ${productDetails.reviews}`
                          : "No reviews yet"}
                      </strong>
                    </div>
                  </div>
                  {productDetails.metaDescription && (
                    <p className={styles.metaDescription}>
                      {productDetails.metaDescription}
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
