export default function News() {
  const newsArticles = [
    {
      id: 1,
      category: "MARKETS",
      title: "Market activity and investor sentiment",
      description:
        "Stay updated with the latest market movements, price changes, and investor sentiment.",
      time: "Today",
    },
    {
      id: 2,
      category: "STOCKS",
      title: "Stocks to watch this week",
      description:
        "Review stocks showing notable activity and potential changes in market momentum.",
      time: "Today",
    },
    {
      id: 3,
      category: "ECONOMY",
      title: "Economic developments",
      description:
        "Follow important economic updates that may influence stocks, ETFs, and crypto markets.",
      time: "Yesterday",
    },
  ];

  return (
    <main className="news-page">
      <p className="eyebrow">MARKET NEWS</p>

      <h1>Latest news</h1>

      <p className="news-page-intro">
        Follow the latest market updates, financial
        developments, and investor sentiment.
      </p>

      <section className="news-page-list">
        {newsArticles.map((article) => (
          <article
            className="news-page-card"
            key={article.id}
          >
            <div className="news-page-card-top">
              <span className="news-category">
                {article.category}
              </span>

              <span className="news-time">
                {article.time}
              </span>
            </div>

            <h2>{article.title}</h2>

            <p>{article.description}</p>

            <button
              type="button"
              className="read-news-button"
            >
              Read article
            </button>
          </article>
        ))}
      </section>
    </main>
  );
}