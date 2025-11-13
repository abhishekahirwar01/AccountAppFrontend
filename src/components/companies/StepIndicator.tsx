import React from "react";
import clsx from "clsx";

const steps = ["Company Details", "GST Details", "TDS Details"];

export default function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="flex justify-between items-center mb-6">
      {steps.map((step, index) => (
        <div key={index} className="flex flex-col items-center flex-1">
          <div
            className={clsx(
              "w-10 h-10 rounded-full flex items-center justify-center font-bold border-2",
              currentStep === index + 1 ? "bg-blue-500 text-white border-blue-500" : "bg-white text-gray-500 border-gray-300"
            )}
          >
            {index + 1}
          </div>
          <span className="mt-2 text-sm text-center">{step}</span>
        </div>
      ))}
    </div>
  );
}
