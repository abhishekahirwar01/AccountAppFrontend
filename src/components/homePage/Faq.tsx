"use client";
import React, { useState } from "react";
import { Plus, MessageCircleQuestion, Send } from "lucide-react";

type FAQ = {
  question: string;
  answer: string;
};

export default function FAQSection() {
   const baseURL = process.env.NEXT_PUBLIC_BASE_URL;
   const [openIndex, setOpenIndex] = useState<number>(-1);
   const [question, setQuestion] = useState<string>("");
   const [isHovered, setIsHovered] = useState<number>(-1);
   const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
   const [submitMessage, setSubmitMessage] = useState<string>("");
   const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const faqs: FAQ[] = [
    {
      question: "How do I update my billing information?",
      answer:
        'To update your billing information, log in and go to the "billing" or "payment" page. Look for an option to "Update payment method" or "Edit billing information" and follow the prompts. Be sure to save your changes before exiting.',
    },
    {
      question: "How do I delete my account?",
      answer: "To delete your account, please contact our support team.",
    },
    {
      question: "How do I join a group or community?",
      answer:
        "You can join groups from the community section in your dashboard.",
    },
    {
      question: "How can I contact customer support?",
      answer: "You can reach our customer support via email or live chat.",
    },
    {
      question: "Which is better short term or long term?",
      answer: "It depends on your specific needs and goals.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex((prev) => (prev === index ? -1 : index));
  };

  return (
    <div className="w-full bg-white py-4 sm:py-6 md:py-8 px-3 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 lg:gap-10">
          {/* Left Section - Contact Form */}
          <div className="p-2 sm:p-3 md:p-4 lg:p-6 transform transition-all duration-700 hover:scale-[1.02]">
            <div className="animate-fadeIn">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-1 transition-all duration-500 text-center sm:text-left">
                <span className="relative inline-block animate-slideUp">
                  <span className="text-gray-900 text-3xl md:text-4xl">
                    Frequently
                  </span>
                  <span className="relative z-10 ml-2 bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-900 bg-clip-text text-transparent text-3xl md:text-4xl">
                    Asked Questions
                  </span>
                  <span className="text-gray-900">.</span>
                </span>
              </h1>
            </div>

            <div className="space-y-1 animate-slideUp mt-2 sm:mt-3 md:mt-3">
              <p className="text-sm sm:text-base bg-gradient-to-r from-[#07a9cf] via-[#07a9cf] to-gray-400 bg-clip-text text-transparent transition-all duration-300 hover:translate-x-2 md:mb-8">
                Visit our Frequently Asked Questions to find helpful
                information.
              </p>
            </div>

            <div className="mt-4 sm:mt-5 md:mt-5 animate-fadeIn">
              <h3 className="text-base sm:text-lg md:text-lg font-semibold text-gray-900 mb-2 sm:mb-2 md:mb-3 transition-all duration-300 hover:text-cyan-600">
                Can't locate the answers you need?
              </h3>
              <p className="text-gray-600 text-xs sm:text-sm md:text-sm mb-3 sm:mb-3 md:mb-4 transition-all duration-300 hover:text-gray-800">
                We're here to help with any questions you have!
              </p>

              <div className="group">
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2 transition-all duration-300 group-focus-within:text-cyan-600">
                  Ask Your Question
                </label>
                <input
                  type="text"
                  placeholder="write here..."
                  value={question}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setQuestion(e.target.value)
                  }
                  className="w-full px-3 sm:px-4 md:px-4 py-2.5 sm:py-3 md:py-3 bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 transition-all duration-300 hover:shadow-lg hover:border-cyan-300 transform hover:-translate-y-1"
                />
              </div>

              {/* Success Message */}
              {showSuccess && (
                <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-green-800 font-medium">Question Submitted Successfully!</p>
                      <p className="text-green-600 text-sm">We'll get back to you soon.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {submitMessage && !showSuccess && (
                <div className="mt-4 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-red-800 font-medium">Submission Failed</p>
                      <p className="text-red-600 text-sm">{submitMessage}</p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={async () => {
                  if (!question.trim()) {
                    setSubmitMessage('Please enter a question before sending.');
                    setShowSuccess(false);
                    setTimeout(() => setSubmitMessage(''), 3000);
                    return;
                  }

                  setIsSubmitting(true);
                  setSubmitMessage('');
                  setShowSuccess(false);

                  try {
                    const response = await fetch(`${baseURL}/api/faq/submit`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ question }),
                    });

                    const data = await response.json();

                    if (data.success) {
                      setShowSuccess(true);
                      setQuestion('');
                      setTimeout(() => setShowSuccess(false), 5000);
                    } else {
                      setSubmitMessage('Failed to submit question. Please try again.');
                      setShowSuccess(false);
                    }
                  } catch (error) {
                    console.error('Error submitting question:', error);
                    setSubmitMessage('An error occurred. Please try again later.');
                    setShowSuccess(false);
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className="mt-3 sm:mt-4 md:mt-4 w-full md:w-auto group relative bg-gradient-to-r from-[#7FE5FD] via-[#07a9cf] to-gray-400 text-white font-medium px-6 sm:px-8 md:px-8 py-2.5 sm:py-3 md:py-3 rounded-xl transition-all duration-300 shadow-md hover:shadow-2xl hover:from-[#6DD4EC] hover:via-[#0698BE] hover:to-gray-800 transform hover:-translate-y-1 hover:scale-105 overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:scale-100"
              >
                <span className="relative z-10 flex items-center justify-center gap-2 text-sm sm:text-base">
                  {isSubmitting ? (
                    <>
                      Sending...
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </>
                  ) : (
                    <>
                      Send Now
                      <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-blue-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>

          {/* Right Section - FAQ Accordion */}
          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index: number) => (
              <div
                key={index}
                onMouseEnter={() => setIsHovered(index)}
                onMouseLeave={() => setIsHovered(-1)}
                className={`rounded-xl sm:rounded-2xl overflow-hidden transition-all duration-500 transform ${
                  isHovered === index ? "scale-[1.02] shadow-xl" : "shadow-md"
                } ${
                  openIndex === index
                    ? "bg-gradient-to-r from-cyan-50 to-blue-50"
                    : "bg-white"
                } hover:shadow-2xl`}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "slideIn 0.5s ease-out forwards",
                }}
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 md:p-6 text-left transition-all duration-300"
                >
                  <div className="flex items-center gap-2 sm:gap-3 flex-1 pr-2">
                    <MessageCircleQuestion
                      className={`w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0 transition-all duration-500 ${
                        openIndex === index
                          ? "text-cyan-600 scale-110 rotate-12"
                          : "text-gray-400"
                      } ${isHovered === index ? "animate-bounce" : ""}`}
                    />
                    <span
                      className={`font-medium text-xs sm:text-sm md:text-base transition-all duration-300 ${
                        openIndex === index ? "text-cyan-700" : "text-gray-900"
                      }`}
                    >
                      {faq.question}
                    </span>
                  </div>
                  <div className="flex-shrink-0">
                    <div
                      className={`rounded-full p-0.5 sm:p-1 transition-all duration-300 ${
                        isHovered === index ? "bg-gray-100" : ""
                      }`}
                    >
                      <Plus
                        className={`w-4 h-4 sm:w-5 sm:h-5 transition-all duration-500 ${
                          openIndex === index
                            ? "rotate-[135deg] text-cyan-600 scale-110"
                            : "rotate-0 text-gray-500"
                        } ${isHovered === index ? "scale-125" : ""}`}
                      />
                    </div>
                  </div>
                </button>

                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    openIndex === index
                      ? "max-h-60 sm:max-h-48 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div
                    className={`px-4 sm:px-5 md:px-6 pb-4 sm:pb-5 md:pb-6 text-xs sm:text-sm leading-relaxed transition-all duration-500 transform ${
                      openIndex === index
                        ? "translate-y-0 text-cyan-700"
                        : "-translate-y-4 text-gray-600"
                    }`}
                  >
                    {faq.answer}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 1s ease-out;
          animation-delay: 0.2s;
          animation-fill-mode: both;
        }

        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
