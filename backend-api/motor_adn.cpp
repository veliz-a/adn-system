#include <iostream>
#include <fstream>
#include <sstream>
#include <vector>
#include <string>
#include <algorithm>
#include <chrono>
#include <stdexcept>
#include <thread>

using namespace std;

// =======================
// Estructuras básicas
// =======================
struct SequenceRecord {
    string name;
    string sequence;
};

struct MatchResult {
    string name;
    vector<int> positions;
};

// =======================
// Utilidad: trim de string
// =======================
void trim(string &s) {
    size_t start = s.find_first_not_of(" \t\r\n");
    if (start == string::npos) {
        s.clear();
        return;
    }
    size_t end = s.find_last_not_of(" \t\r\n");
    s = s.substr(start, end - start + 1);
}

// =======================
// Carga y validación de CSV
// Formato esperado: Nombre,Secuencia
// - Exactamente 2 columnas
// - Secuencia solo con caracteres A,C,G,T,N
// =======================
vector<SequenceRecord> load_csv(const string& path) {
    ifstream file(path);
    if (!file.is_open()) {
        throw runtime_error("No se pudo abrir el CSV: " + path);
    }

    vector<SequenceRecord> records;
    string line;
    int line_number = 0;

    while (getline(file, line)) {
        ++line_number;
        if (line.empty()) continue;

        stringstream ss(line);
        string name, seq, extra;

        if (!getline(ss, name, ',')) {
            cerr << "[WARN] Línea " << line_number << ": sin primera columna, se omite.\n";
            continue;
        }
        if (!getline(ss, seq, ',')) {
            cerr << "[WARN] Línea " << line_number << ": sin segunda columna, se omite.\n";
            continue;
        }
        // Si hay una tercera columna, la fila no cumple el formato RF-01
        if (getline(ss, extra, ',')) {
            cerr << "[WARN] Línea " << line_number << ": tiene más de 2 columnas, se omite.\n";
            continue;
        }

        trim(name);
        trim(seq);

        if (name.empty() || seq.empty()) {
            cerr << "[WARN] Línea " << line_number << ": nombre o secuencia vacíos, se omite.\n";
            continue;
        }

        // Normalizar a mayúsculas (ADN)
        transform(seq.begin(), seq.end(), seq.begin(), ::toupper);

        // Validar alfabeto ADN extendido {A,C,G,T,N}
        bool invalid = false;
        for (char c : seq) {
            switch (c) {
                case 'A':
                case 'C':
                case 'G':
                case 'T':
                case 'N': // nucleótido ambiguo permitido
                    break;
                default:
                    invalid = true;
                    break;
            }
            if (invalid) break;
        }
        if (invalid) {
            cerr << "[WARN] Línea " << line_number
                 << ": secuencia con caracteres fuera de {A,C,G,T,N}, se omite.\n";
            continue;
        }

        records.push_back({name, seq});
    }

    return records;
}

// =======================
// KMP (Knuth-Morris-Pratt)
// =======================
vector<int> build_lps(const string& pattern) {
    int m = static_cast<int>(pattern.size());
    vector<int> lps(m, 0);
    int len = 0;
    int i = 1;

    while (i < m) {
        if (pattern[i] == pattern[len]) {
            len++;
            lps[i] = len;
            i++;
        } else {
            if (len != 0) {
                len = lps[len - 1];
            } else {
                lps[i] = 0;
                i++;
            }
        }
    }
    return lps;
}

vector<int> kmp_search(const string& text, const string& pattern) {
    vector<int> positions;
    if (pattern.empty() || text.size() < pattern.size()) return positions;

    vector<int> lps = build_lps(pattern);
    int n = static_cast<int>(text.size());
    int m = static_cast<int>(pattern.size());
    int i = 0, j = 0;

    while (i < n) {
        if (text[i] == pattern[j]) {
            i++;
            j++;
            if (j == m) {
                positions.push_back(i - j);
                j = lps[j - 1];
            }
        } else {
            if (j != 0) {
                j = lps[j - 1];
            } else {
                i++;
            }
        }
    }
    return positions;
}

// =======================
// Rabin–Karp para ADN
// - Base 4: A=0, C=1, G=2, T=3
// - 'N' se mapea a 0 pero siempre se verifica carácter a carácter
// =======================
int val(char c) {
    switch (c) {
        case 'A': return 0;
        case 'C': return 1;
        case 'G': return 2;
        case 'T': return 3;
        case 'N': return 0; // nucleótido ambiguo
        default:  return 0;
    }
}

vector<int> rabin_karp_search(const string& text,
                               const string& pattern,
                               long long& collision_count) {
    vector<int> positions;
    int n = static_cast<int>(text.size());
    int m = static_cast<int>(pattern.size());
    if (m == 0 || n < m) return positions;

    const int base = 4;
    const long long mod = 1000000007LL;

    long long hash_p = 0;
    long long hash_t = 0;
    long long power = 1;

    for (int i = 0; i < m; ++i) {
        hash_p = (hash_p * base + val(pattern[i])) % mod;
        hash_t = (hash_t * base + val(text[i])) % mod;
        if (i < m - 1) {
            power = (power * base) % mod;
        }
    }

    for (int i = 0; i <= n - m; ++i) {
        if (hash_p == hash_t) {
            bool match = true;
            for (int j = 0; j < m; ++j) {
                if (text[i + j] != pattern[j]) {
                    match = false;
                    break;
                }
            }
            if (match) {
                positions.push_back(i);
            } else {
                // Colisión: hash igual pero contenido distinto
                collision_count++;
            }
        }

        if (i < n - m) {
            hash_t = (hash_t - val(text[i]) * power) % mod;
            if (hash_t < 0) hash_t += mod;
            hash_t = (hash_t * base + val(text[i + m])) % mod;
        }
    }

    return positions;
}

// =======================
// Utilidad: escape JSON básico
// =======================
string json_escape(const string& s) {
    string out;
    out.reserve(s.size() + 10);
    for (char c : s) {
        switch (c) {
            case '\"': out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\b': out += "\\b";  break;
            case '\f': out += "\\f";  break;
            case '\n': out += "\\n";  break;
            case '\r': out += "\\r";  break;
            case '\t': out += "\\t";  break;
            default:
                if (static_cast<unsigned char>(c) < 0x20) {
                    char buf[7];
                    snprintf(buf, sizeof(buf), "\\u%04x", c);
                    out += buf;
                } else {
                    out += c;
                }
        }
    }
    return out;
}

// =======================
// Construcción del JSON
// =======================
string build_json(const string& algorithm,
                  const string& pattern,
                  int total_sequences,
                  const vector<MatchResult>& matches,
                  long long time_ms,
                  int threads_used = 1,
                  long long hash_collisions = 0) {

    ostringstream os;
    os << "{\n";
    os << "  \"success\": true,\n";
    os << "  \"algorithm\": \"" << json_escape(algorithm) << "\",\n";
    os << "  \"pattern\": \"" << json_escape(pattern) << "\",\n";
    os << "  \"total_sequences\": " << total_sequences << ",\n";
    os << "  \"execution_time_ms\": " << time_ms << ",\n";
    os << "  \"threads_used\": " << threads_used << ",\n";
    os << "  \"hash_collisions\": " << hash_collisions << ",\n";

    os << "  \"matches\": [\n";
    for (size_t i = 0; i < matches.size(); ++i) {
        const auto& m = matches[i];
        os << "    {\n";
        os << "      \"name\": \"" << json_escape(m.name) << "\",\n";
        os << "      \"positions\": [";
        for (size_t j = 0; j < m.positions.size(); ++j) {
            os << m.positions[j];
            if (j + 1 < m.positions.size()) os << ", ";
        }
        os << "]\n";
        os << "    }";
        if (i + 1 < matches.size()) os << ",";
        os << "\n";
    }
    os << "  ],\n";
    os << "  \"match_count\": " << matches.size() << "\n";
    os << "}\n";

    return os.str();
}

// =======================
// main: CLI del motor
// =======================
int main(int argc, char* argv[]) {
    string algorithm;
    string pattern;
    string csv_path;
    int threads_requested = 1;

    for (int i = 1; i < argc; ++i) {
        string arg = argv[i];
        if (arg == "--algorithm" && i + 1 < argc) {
            algorithm = argv[++i];
        } else if (arg == "--pattern" && i + 1 < argc) {
            pattern = argv[++i];
        } else if (arg == "--csv" && i + 1 < argc) {
            csv_path = argv[++i];
        } else if (arg == "--threads" && i + 1 < argc) {
            threads_requested = stoi(argv[++i]);
        }
    }

    if (algorithm.empty() || pattern.empty() || csv_path.empty()) {
        cerr << "Uso: motor_adn.exe --algorithm kmp|rabin_karp "
             << "--pattern PATRON --csv archivo.csv [--threads N]\n";
        return 1;
    }

    try {
        auto records = load_csv(csv_path);
        if (records.empty()) {
            cerr << "[WARN] CSV sin registros válidos tras la validación.\n";
        }

        auto start = chrono::high_resolution_clock::now();

        int threads_used = threads_requested;
        if (threads_used < 1) threads_used = 1;
        if (!records.empty() && threads_used > static_cast<int>(records.size())) {
            threads_used = static_cast<int>(records.size());
        }
        if (records.empty()) {
            threads_used = 1; // nada que paralelizar
        }

        vector<MatchResult> matches;
        long long total_collisions = 0;

        if (!records.empty()) {
            // Paralelización por bloques de registros
            size_t n = records.size();
            size_t chunk = (n + threads_used - 1) / threads_used;

            vector<vector<MatchResult>> matches_per_thread(threads_used);
            vector<long long> collisions_per_thread(threads_used, 0);
            vector<thread> threads;
            threads.reserve(threads_used);

            auto worker = [&](int tid, size_t start_idx, size_t end_idx) {
                for (size_t idx = start_idx; idx < end_idx; ++idx) {
                    const auto& rec = records[idx];
                    vector<int> pos;
                    if (algorithm == "kmp") {
                        pos = kmp_search(rec.sequence, pattern);
                    } else if (algorithm == "rabin_karp") {
                        long long local_collisions = 0;
                        pos = rabin_karp_search(rec.sequence, pattern, local_collisions);
                        collisions_per_thread[tid] += local_collisions;
                    }

                    if (!pos.empty()) {
                        matches_per_thread[tid].push_back({rec.name, pos});
                    }
                }
            };

            int real_threads = 0;
            for (int t = 0; t < threads_used; ++t) {
                size_t start_idx = static_cast<size_t>(t) * chunk;
                if (start_idx >= n) break;
                size_t end_idx = min(start_idx + chunk, n);
                threads.emplace_back(worker, t, start_idx, end_idx);
                real_threads++;
            }

            // Actualizar threads_used por si había más hilos solicitados que bloques reales
            threads_used = real_threads;

            for (auto& th : threads) {
                th.join();
            }

            // Merge de resultados
            for (int t = 0; t < threads_used; ++t) {
                for (auto& m : matches_per_thread[t]) {
                    matches.push_back(std::move(m));
                }
                total_collisions += collisions_per_thread[t];
            }
        }

        auto end = chrono::high_resolution_clock::now();
        long long ms =
            chrono::duration_cast<chrono::milliseconds>(end - start).count();

        string json =
            build_json(algorithm, pattern,
                       static_cast<int>(records.size()),
                       matches, ms, threads_used, total_collisions);

        cout << json;
        return 0;

    } catch (const exception& ex) {
        cerr << "Error: " << ex.what() << "\n";
        return 1;
    }
}
