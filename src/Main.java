import java.util.*;
import java.io.FileWriter;
import java.io.IOException;
import java.text.DecimalFormat;

public class Main {
    private static Scanner scanner = new Scanner(System.in);
    private static ArrayList<Investment> investments = new ArrayList<>();
    private static DecimalFormat df = new DecimalFormat("#,##0.00");

    public static void main(String[] args) {
        System.out.println("=== Simulador de Investimentos (Java) ===");
        boolean running = true;
        while (running) {
            System.out.println("\nMenu:");
            System.out.println("1. Criar novo investimento");
            System.out.println("2. Listar investimentos");
            System.out.println("3. Simular investimento");
            System.out.println("4. Exportar simulação para CSV");
            System.out.println("5. Exemplo rápido (simular agora)");
            System.out.println("0. Sair");
            System.out.print("Escolha uma opção: ");
            String opt = scanner.nextLine().trim();
            switch (opt) {
                case "1": createInvestment(); break;
                case "2": listInvestments(); break;
                case "3": simulateInvestment(); break;
                case "4": exportCSV(); break;
                case "5": quickExample(); break;
                case "0": running = false; break;
                default: System.out.println("Opção inválida."); break;
            }
        }
        System.out.println("Encerrando simulador. Até logo!");
    }

    private static void createInvestment() {
        System.out.print("Nome do investimento: ");
        String name = scanner.nextLine();
        double principal = readDouble("Capital inicial (R$): ");
        double annualRate = readDouble("Taxa anual (%) ex: 5 para 5%: ") / 100.0;
        int years = readInt("Tempo (anos): ");
        System.out.print("Compounding (1=anual, 12=mensal, 365=diário) [padrão 12]: ");
        String comp = scanner.nextLine().trim();
        int compPerYear = comp.isEmpty() ? 12 : Integer.parseInt(comp);
        double monthlyContribution = readDouble("Contribuição mensal (R$), 0 se nenhuma: ");
        Investment inv = new Investment(name, principal, annualRate, years, compPerYear, monthlyContribution);
        investments.add(inv);
        System.out.println("Investimento criado com sucesso!");
    }

    private static void listInvestments() {
        if (investments.isEmpty()) {
            System.out.println("Nenhum investimento cadastrado.");
            return;
        }
        System.out.println("Investimentos cadastrados:");
        for (int i = 0; i < investments.size(); i++) {
            Investment inv = investments.get(i);
            System.out.printf("%d) %s - Principal: R$ %s - Taxa anual: %s%% - %d anos%n",
                i+1, inv.getName(), df.format(inv.getPrincipal()), df.format(inv.getAnnualRate()*100), inv.getYears());
        }
    }

    private static void simulateInvestment() {
        if (investments.isEmpty()) {
            System.out.println("Nenhum investimento para simular.");
            return;
        }
        listInvestments();
        int idx = readInt("Escolha o número do investimento para simular: ") - 1;
        if (idx < 0 || idx >= investments.size()) {
            System.out.println("Índice inválido.");
            return;
        }
        Investment inv = investments.get(idx);
        System.out.println("\nSimulação: " + inv.getName());
        ArrayList<Investment.YearSnapshot> schedule = inv.projectSchedule();
        System.out.println("Ano | Saldo final | Juros do ano | Contribuições no ano");
        for (Investment.YearSnapshot s : schedule) {
            System.out.printf("%3d | R$ %10s | R$ %10s | R$ %10s%n",
                s.year, df.format(s.endBalance), df.format(s.interestEarned), df.format(s.annualContribution));
        }
        Investment.YearSnapshot last = schedule.get(schedule.size()-1);
        System.out.println("\nResultado final após " + inv.getYears() + " anos: R$ " + df.format(last.endBalance));
    }

    private static void exportCSV() {
        if (investments.isEmpty()) {
            System.out.println("Nenhum investimento para exportar.");
            return;
        }
        listInvestments();
        int idx = readInt("Escolha o número do investimento para exportar: ") - 1;
        if (idx < 0 || idx >= investments.size()) {
            System.out.println("Índice inválido.");
            return;
        }
        Investment inv = investments.get(idx);
        String filename = sanitizeFilename(inv.getName()) + "_simulacao.csv";
        try (FileWriter fw = new FileWriter(filename)) {
            fw.append("Ano,SaldoFinal,JurosDoAno,ContribuicaoAnual\n");
            for (Investment.YearSnapshot s : inv.projectSchedule()) {
                fw.append(String.format("%d,%.2f,%.2f,%.2f\n",
                    s.year, s.endBalance, s.interestEarned, s.annualContribution));
            }
            System.out.println("Exportado para " + filename + " (no diretório atual).");
        } catch (IOException e) {
            System.out.println("Erro ao salvar CSV: " + e.getMessage());
        }
    }

    private static void quickExample() {
        Investment exemplo = new Investment("Exemplo Verde", 5000.0, 0.06, 10, 12, 100.0);
        System.out.println("Simulando investimento de exemplo:");
        System.out.println(exemplo);
        ArrayList<Investment.YearSnapshot> schedule = exemplo.projectSchedule();
        Investment.YearSnapshot last = schedule.get(schedule.size()-1);
        System.out.println("Saldo final após 10 anos: R$ " + df.format(last.endBalance));
    }

    private static double readDouble(String prompt) {
        while (true) {
            try {
                System.out.print(prompt);
                String s = scanner.nextLine().replace(",", ".");
                return Double.parseDouble(s);
            } catch (Exception e) {
                System.out.println("Entrada inválida. Tente novamente.");
            }
        }
    }

    private static int readInt(String prompt) {
        while (true) {
            try {
                System.out.print(prompt);
                String s = scanner.nextLine().trim();
                return Integer.parseInt(s);
            } catch (Exception e) {
                System.out.println("Entrada inválida. Tente novamente.");
            }
        }
    }

    private static String sanitizeFilename(String name) {
        return name.replaceAll("[^a-zA-Z0-9\\-_]", "_");
    }
}