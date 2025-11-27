#include <bits/stdc++.h>

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
// Carga de CSV
// Formato esperado: nombre,sequence
// =======================
vector<SequenceRecord> load_csv(const string& path) {
    ifstream file(path);
    if (!file.is_open()) {
        throw runtime_error("No se pudo abrir el CSV: " + path);
    }

    vector<SequenceRecord> records;
    string line;
    while (getline(file, line)) {
        if (line.empty()) continue;
        stringstream ss(line);
        string name, seq;

        if (!getline(ss, name, ',')) continue;
        if (!getline(ss, seq)) continue;

        trim(name);
        trim(seq);

        // Normalizar a mayúsculas (ADN)
        transform(seq.begin(), seq.end(), seq.begin(), ::toupper);

        records.push_back({name, seq});
    }
    return records;
}

// =======================
// KMP (Knuth-Morris-Pratt)
// =======================
vector<int> build_lps(const string& pattern) {
    int m = (int)pattern.size();
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
    int n = (int)text.size();
    int m = (int)pattern.size();
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
// =======================
int val(char c) {
    switch (c) {
        case 'A': return 0;
        case 'C': return 1;
        case 'G': return 2;
        case 'T': return 3;
        default:  return 0;
    }
}

vector<int> rabin_karp_search(const string& text, const string& pattern) {
    vector<int> positions;
    int n = (int)text.size();
    int m = (int)pattern.size();
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
            if (match) positions.push_back(i);
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
                    // control char -> \u00XX
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
                  int threads_used = 1) {

    ostringstream os;
    os << "{\n";
    os << "  \"success\": true,\n";
    os << "  \"algorithm\": \"" << json_escape(algorithm) << "\",\n";
    os << "  \"pattern\": \"" << json_escape(pattern) << "\",\n";
    os << "  \"total_sequences\": " << total_sequences << ",\n";
    os << "  \"execution_time_ms\": " << time_ms << ",\n";
    os << "  \"threads_used\": " << threads_used << ",\n";

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

    for (int i = 1; i < argc; ++i) {
        string arg = argv[i];
        if (arg == "--algorithm" && i + 1 < argc) {
            algorithm = argv[++i];
        } else if (arg == "--pattern" && i + 1 < argc) {
            pattern = argv[++i];
        } else if (arg == "--csv" && i + 1 < argc) {
            csv_path = argv[++i];
        }
    }

    if (algorithm.empty() || pattern.empty() || csv_path.empty()) {
        cerr << "Uso: motor_adn.exe --algorithm kmp|rabin_karp "
             << "--pattern PATRON --csv archivo.csv\n";
        return 1;
    }

    try {
        auto records = load_csv(csv_path);

        auto start = chrono::high_resolution_clock::now();

        vector<MatchResult> matches;
        for (const auto& rec : records) {
            vector<int> pos;
            if (algorithm == "kmp") {
                pos = kmp_search(rec.sequence, pattern);
            } else if (algorithm == "rabin_karp") {
                pos = rabin_karp_search(rec.sequence, pattern);
            } else {
                cerr << "Algoritmo no soportado: " << algorithm << "\n";
                return 1;
            }

            if (!pos.empty()) {
                matches.push_back({rec.name, pos});
            }
        }

        auto end = chrono::high_resolution_clock::now();
        long long ms =
            chrono::duration_cast<chrono::milliseconds>(end - start).count();

        string json = build_json(algorithm, pattern,
                                 (int)records.size(), matches, ms, 1);

        cout << json;
        return 0;

    } catch (const exception& ex) {
        cerr << "Error: " << ex.what() << "\n";
        return 1;
    }
}
