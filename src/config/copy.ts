export const COPY = {
  credits: {
    noneRemaining: "You have no credits. Buy more or upgrade to Pro and save 60%.",
    uploadBlocked: "You have no credits available. Purchase more or upgrade to Pro.",
    perCredit: {
      regular: "$0.50 per credit",
      pro: "$0.20 per credit (60% savings)"
    },
    description: "Each credit allows one image upload (up to 10 trades). Credits never expire."
  },
  plans: {
    free: {
      name: "Free",
      description: "Get started with 5 free credits",
      cta: "Continue Free",
      features: [
        "5 free upload credits",
        "AI trade extraction",
        "Manual entry mode",
        "Basic analytics"
      ]
    },
    pro: {
      name: "Pro",
      description: "Perfect for active traders - 30 monthly credits + 60% discount",
      cta: "Upgrade to Pro",
      features: [
        "30 monthly credits (never expire)",
        "60% discount on extra credits",
        "Premium dashboard customization",
        "Advanced analytics & widgets",
        "Enhanced XP progression",
        "Custom themes"
      ]
    },
    elite: {
      name: "Elite",
      description: "For professionals - 150 monthly credits + priority support",
      cta: "Go Elite",
      features: [
        "150 monthly credits",
        "All Pro features",
        "Priority support",
        "Early feature access",
        "Advanced trading insights"
      ]
    }
  },
  upsells: {
    proDiscount: "Save 60% on credits with Pro — includes 30 monthly credits that never expire.",
    upgradeModal: {
      title: "Upgrade to Pro and Save 60% on Credits",
      benefits: [
        "Premium dashboard customization",
        "30 monthly credits (never expire)",
        "Premium widgets and analytics",
        "Enhanced XP system (faster progression)",
        "Priority support and early access"
      ]
    },
    proBanner: {
      title: "Save 60% with Pro",
      subtitle: "Pro users pay only $4 for 20 credits",
      bullets: [
        "Includes 30 monthly credits that never expire",
        "Premium dashboard customization",
        "Access to advanced widgets and analytics"
      ]
    }
  },
  errors: {
    noCredits: "You have no credits available. Purchase more or upgrade to Pro.",
    uploadTimeout: "Upload failed due to slow processing. Try a clearer screenshot or manual entry.",
    checkoutFailed: "Checkout failed. Please try again or contact support."
  }
};
