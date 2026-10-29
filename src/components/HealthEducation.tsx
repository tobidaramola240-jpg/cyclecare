import React, { useState } from 'react';
import { Article, QuizQuestion } from '../types';
import { ARTICLES_DATA, QUIZ_QUESTIONS } from '../data/sampleData';

interface HealthEducationProps {
  bookmarkedIds: string[];
  onToggleBookmark: (articleId: string) => void;
}

export const HealthEducation: React.FC<HealthEducationProps> = ({
  bookmarkedIds,
  onToggleBookmark,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [activeQuizIndex, setActiveQuizIndex] = useState<number>(0);
  const [quizAnsweredState, setQuizAnsweredState] = useState<Record<string, { chosen: boolean; isCorrect: boolean }>>({});
  const [showBookmarksOnly, setShowBookmarksOnly] = useState<boolean>(false);

  // Filtered articles
  const filteredArticles = ARTICLES_DATA.filter((article) => {
    const matchesCategory = selectedCategory === 'all' || article.category === selectedCategory;
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.summary.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBookmark = !showBookmarksOnly || bookmarkedIds.includes(article.id);

    return matchesCategory && matchesSearch && matchesBookmark;
  });

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'hormones', label: 'Hormones 101' },
    { id: 'nutrition', label: 'Nutrition & Syncing' },
    { id: 'fertility', label: 'Fertility & TTC' },
    { id: 'basics', label: 'Pelvic Health' },
    { id: 'wellness', label: 'Mental Wellbeing' },
  ];

  // Quiz Handling
  const currentQuiz = QUIZ_QUESTIONS[activeQuizIndex];
  const answeredInfo = quizAnsweredState[currentQuiz.id];

  const handleAnswerQuiz = (userGuessIsFact: boolean) => {
    if (answeredInfo) return;
    const isCorrect = userGuessIsFact === currentQuiz.isFact;
    setQuizAnsweredState((prev) => ({
      ...prev,
      [currentQuiz.id]: { chosen: userGuessIsFact, isCorrect },
    }));
  };

  const handleNextQuiz = () => {
    if (activeQuizIndex < QUIZ_QUESTIONS.length - 1) {
      setActiveQuizIndex(activeQuizIndex + 1);
    } else {
      setActiveQuizIndex(0);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      {/* Education Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-pink-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-pink-600 uppercase tracking-wider">
            CycleCare Health Academy
          </span>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight mt-0.5">
            Evidence-Based Women's Health
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Original, medically reviewed guides with documented scientific sources and review dates
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <input
            type="text"
            placeholder="Search hormones, cramps, nutrition..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-300 text-xs text-slate-800 bg-pink-50/40"
          />
          <svg className="w-4 h-4 text-slate-400 absolute left-3 top-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      {/* Prominent Medical & Care Replacement Disclaimer */}
      <div className="p-4 rounded-3xl bg-purple-50/80 border border-purple-200 shadow-sm flex items-start gap-3.5">
        <span className="text-xl shrink-0">🛡️</span>
        <div className="text-xs text-purple-950 leading-relaxed">
          <span className="font-bold uppercase tracking-wider block mb-0.5">
            Medical Disclaimer & Clinical Care Notice
          </span>
          All educational materials in CycleCare are written and medically reviewed for educational purposes only. <strong className="underline font-bold">This app does not provide medical diagnoses, treatment plans, or clinical care, and does NOT replace consultation with a qualified healthcare provider.</strong> If you experience severe pain, sudden cycle changes, or concerning symptoms, please seek professional medical attention.
        </div>
      </div>

      {/* ================= INTERACTIVE MYTH VS FACT QUIZ WIDGET ================= */}
      <section className="bg-gradient-to-r from-pink-50 via-purple-50 to-indigo-50 rounded-3xl p-6 sm:p-7 border border-pink-200/80 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-900 bg-purple-200/60 px-3 py-1 rounded-full">
            🧠 Myth vs. Fact Quiz · Question {activeQuizIndex + 1} of {QUIZ_QUESTIONS.length}
          </span>
          <button
            onClick={handleNextQuiz}
            className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
          >
            <span>Next Question</span>
            <span>→</span>
          </button>
        </div>

        <h3 className="text-base sm:text-lg font-bold text-slate-800 mb-2">
          "{currentQuiz.mythStatement}"
        </h3>
        <p className="text-xs text-slate-600 mb-4">{currentQuiz.question}</p>

        {/* Fact vs Myth Buttons */}
        {!answeredInfo ? (
          <div className="flex gap-3 max-w-sm">
            <button
              onClick={() => handleAnswerQuiz(true)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white border border-pink-200 text-xs font-bold text-slate-700 hover:bg-pink-100 hover:text-pink-800 shadow-sm transition-all"
            >
              ✅ It's a Fact
            </button>
            <button
              onClick={() => handleAnswerQuiz(false)}
              className="flex-1 py-2.5 px-4 rounded-xl bg-white border border-purple-200 text-xs font-bold text-slate-700 hover:bg-purple-100 hover:text-purple-800 shadow-sm transition-all"
            >
              ❌ It's a Myth
            </button>
          </div>
        ) : (
          <div className={`p-4 rounded-2xl border text-xs leading-relaxed animate-fadeIn ${
            answeredInfo.isCorrect
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-900'
              : 'bg-rose-50/90 border-rose-200 text-rose-900'
          }`}>
            <div className="font-bold flex items-center gap-1.5 mb-1.5 text-sm">
              {answeredInfo.isCorrect ? '🎉 Correct!' : '💡 Actually...'}
              <span>
                {currentQuiz.isFact ? 'This statement is a FACT.' : 'This statement is a MYTH.'}
              </span>
            </div>
            <p className="mb-2">{currentQuiz.explanation}</p>
            <div className="text-[11px] font-semibold text-slate-500 pt-1 border-t border-slate-200/60">
              Scientific Reference: {currentQuiz.scientificReference}
            </div>
          </div>
        )}
      </section>

      {/* ================= CATEGORY CHIPS & SAVED TOGGLE ================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.id);
                setShowBookmarksOnly(false);
              }}
              className={`py-1.5 px-3.5 rounded-full text-xs font-semibold transition-all ${
                selectedCategory === cat.id && !showBookmarksOnly
                  ? 'bg-pink-500 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-pink-50 border border-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowBookmarksOnly(!showBookmarksOnly)}
          className={`py-1.5 px-3.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${
            showBookmarksOnly
              ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
              : 'bg-white text-slate-600 hover:bg-purple-50 border-purple-200'
          }`}
        >
          <span>🔖 Saved Articles ({bookmarkedIds.length})</span>
        </button>
      </div>

      {/* ================= ARTICLES GRID ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredArticles.map((article) => {
          const isSaved = bookmarkedIds.includes(article.id);

          return (
            <article
              key={article.id}
              className="bg-white rounded-3xl border border-pink-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all"
            >
              {/* Featured Image */}
              <div className="h-44 w-full relative overflow-hidden bg-pink-100">
                <img
                  src={article.featuredImage}
                  alt={article.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleBookmark(article.id);
                  }}
                  className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md transition-all ${
                    isSaved
                      ? 'bg-purple-600 text-white shadow-md'
                      : 'bg-white/80 text-slate-600 hover:text-purple-600'
                  }`}
                  title={isSaved ? 'Remove from saved' : 'Save article'}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill={isSaved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                  </svg>
                </button>
                <span className="absolute bottom-3 left-3 px-2.5 py-0.5 rounded-full bg-white/90 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-purple-900">
                  {article.category}
                </span>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1.5 font-medium">
                    <span>{article.readTimeMinutes} min read</span>
                    <span>•</span>
                    <span>By {article.author}</span>
                  </div>
                  <h3 className="font-extrabold text-base text-slate-800 group-hover:text-pink-600 transition-colors leading-snug">
                    {article.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                    {article.subtitle}
                  </p>

                  {/* Medical Review Badge */}
                  {article.medicalReviewer && (
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-100">
                      <span>✓</span>
                      <span>Medically reviewed by {article.medicalReviewer}</span>
                      <span>·</span>
                      <span>{article.reviewDate}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-pink-50 flex items-center justify-between">
                  <span className="text-[11px] text-purple-900/60 font-medium">
                    {article.publishDate}
                  </span>
                  <button
                    onClick={() => setSelectedArticle(article)}
                    className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                  >
                    <span>Read Article</span>
                    <span>→</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* ================= FULL ARTICLE READER MODAL ================= */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 border border-pink-100 shadow-2xl relative my-auto">
            {/* Close Button */}
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            {/* Article Header */}
            <div className="mb-6">
              <span className="px-3 py-1 rounded-full bg-pink-100 text-pink-800 text-[11px] font-bold uppercase tracking-wider">
                {selectedArticle.category}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight mt-3 mb-2">
                {selectedArticle.title}
              </h2>
              <p className="text-slate-600 text-sm italic">
                {selectedArticle.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span className="font-bold text-slate-800">{selectedArticle.author}</span>
                <span>•</span>
                <span>{selectedArticle.authorTitle}</span>
                <span>•</span>
                <span>{selectedArticle.readTimeMinutes} min read</span>
              </div>

              {/* Medical Review Credentials Box */}
              {selectedArticle.medicalReviewer && (
                <div className="mt-3 p-3 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 flex items-start gap-2.5">
                  <span className="text-base shrink-0">🩺</span>
                  <div>
                    <span className="font-bold">Medically Reviewed by {selectedArticle.medicalReviewer}</span>
                    <span className="block text-[11px] text-emerald-800">{selectedArticle.medicalReviewerTitle}</span>
                    <span className="block text-[10px] text-emerald-700/80 mt-0.5">Reviewed and verified for clinical accuracy on {selectedArticle.reviewDate}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Key Takeaways Box */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200/80 mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-purple-900 mb-2 flex items-center gap-1.5">
                <span>✨</span>
                <span>Key Takeaways</span>
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {selectedArticle.keyTakeaways.map((takeaway, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-pink-500 font-bold">•</span>
                    <span>{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Main Content Paragraphs */}
            <div className="space-y-4 text-sm text-slate-700 leading-relaxed mb-6">
              {selectedArticle.contentParagraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>

            {/* Scientific Sources & Citations Section */}
            {selectedArticle.sources && selectedArticle.sources.length > 0 && (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 mb-6 space-y-2">
                <h4 className="font-bold text-slate-800 flex items-center gap-1.5 uppercase text-[11px] tracking-wider">
                  <span>📚</span>
                  <span>Scientific Sources & Medical Guidelines</span>
                </h4>
                <ul className="space-y-1.5">
                  {selectedArticle.sources.map((src, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] text-slate-600">
                      <span className="font-bold text-purple-700">[{i + 1}]</span>
                      <div>
                        <strong className="text-slate-800">{src.title}</strong> — {src.citation} {src.year ? `(${src.year})` : ''}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Article Specific Medical Disclaimer */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              <strong>Medical Disclaimer: </strong>
              {selectedArticle.disclaimer || 'This educational article is strictly for informational and body literacy purposes. It does not provide medical diagnoses, treatment instructions, or clinical guarantees. Always consult a licensed healthcare professional.'}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => onToggleBookmark(selectedArticle.id)}
                className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1.5"
              >
                <span>{bookmarkedIds.includes(selectedArticle.id) ? '🔖 Saved in Bookmarks' : '☆ Save Article'}</span>
              </button>
              <button
                onClick={() => setSelectedArticle(null)}
                className="py-2 px-5 rounded-xl bg-slate-800 text-white font-semibold text-xs hover:bg-slate-900 transition-colors"
              >
                Done Reading
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
