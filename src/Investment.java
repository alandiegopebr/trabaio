import java.util.ArrayList;
import java.util.Objects;

public class Investment {
    private String name;
    private double principal;
    private double annualRate; // decimal (ex: 0.05)
    private int years;
    private int compoundingPerYear; // e.g., 12 for monthly
    private double monthlyContribution;

    public Investment(String name, double principal, double annualRate, int years, int compoundingPerYear, double monthlyContribution) {
        this.name = name;
        this.principal = principal;
        this.annualRate = annualRate;
        this.years = years;
        this.compoundingPerYear = compoundingPerYear;
        this.monthlyContribution = monthlyContribution;
    }

    public String getName() { return name; }
    public double getPrincipal() { return principal; }
    public double getAnnualRate() { return annualRate; }
    public int getYears() { return years; }
    public int getCompoundingPerYear() { return compoundingPerYear; }
    public double getMonthlyContribution() { return monthlyContribution; }

    // Projects a yearly schedule (one snapshot per year)
    public ArrayList<YearSnapshot> projectSchedule() {
        ArrayList<YearSnapshot> list = new ArrayList<>();
        double balance = principal;
        int totalPeriodsPerYear = compoundingPerYear;
        double periodRate = annualRate / totalPeriodsPerYear;

        for (int y = 1; y <= years; y++) {
            double starting = balance;
            double interestEarnedThisYear = 0.0;
            double annualContribution = monthlyContribution * 12.0;
            // simulate period by period within the year
            for (int p = 0; p < totalPeriodsPerYear; p++) {
                // contribution allocated per period (if monthly and compPerYear=12, it fits)
                double contributionThisPeriod = monthlyContribution * (12.0 / totalPeriodsPerYear);
                balance += contributionThisPeriod;
                double interest = balance * periodRate;
                balance += interest;
                interestEarnedThisYear += interest;
            }
            YearSnapshot snap = new YearSnapshot(y, starting, balance, interestEarnedThisYear, annualContribution);
            list.add(snap);
        }
        return list;
    }

    public static class YearSnapshot {
        public int year;
        public double startBalance;
        public double endBalance;
        public double interestEarned;
        public double annualContribution;
        public YearSnapshot(int year, double startBalance, double endBalance, double interestEarned, double annualContribution) {
            this.year = year;
            this.startBalance = startBalance;
            this.endBalance = endBalance;
            this.interestEarned = interestEarned;
            this.annualContribution = annualContribution;
        }
    }

    @Override
    public String toString() {
        return "Investment{" +
                "name='" + name + '\'' +
                ", principal=" + principal +
                ", annualRate=" + annualRate +
                ", years=" + years +
                ", compoundingPerYear=" + compoundingPerYear +
                ", monthlyContribution=" + monthlyContribution +
                '}';
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
         Investment that = (Investment) o;
        return Double.compare(that.principal, principal) == 0 &&
                Double.compare(that.annualRate, annualRate) == 0 &&
                years == that.years &&
                compoundingPerYear == that.compoundingPerYear &&
                Double.compare(that.monthlyContribution, monthlyContribution) == 0 &&
                Objects.equals(name, that.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(name, principal, annualRate, years, compoundingPerYear, monthlyContribution);
    }
}