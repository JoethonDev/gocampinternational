export function PageBanner({
  image,
  alt,
  title,
  hiddenTitle = false
}: {
  image: string;
  alt: string;
  title: string;
  hiddenTitle?: boolean;
}) {
  return (
    <div className="container-fluid p-0">
      <div className="position-relative">
        <img src={image} className="img-fluid w-100 page-banner-image" alt={alt} />
        {hiddenTitle ? (
          <h1 className="visually-hidden">{title}</h1>
        ) : (
          <div className="position-absolute top-50 start-50 translate-middle text-center text-white">
            <h1 className="display-4 fw-bold">{title}</h1>
          </div>
        )}
      </div>
    </div>
  );
}
