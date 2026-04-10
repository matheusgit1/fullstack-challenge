export const useCurrencyFormat = () => {
  function toBRL(amount?: number | null) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format((amount || 0) / 100);
  }

  function toCENTS(amount?: number | null) {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      maximumFractionDigits: 2,
    }).format((amount || 0) * 100);
  }

  return { toBRL, toCENTS };
};
