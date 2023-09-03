package main

import (
	"encoding/json"
	"fmt"
	"github.com/gorilla/handlers"
	"github.com/joho/godotenv"
	_ "github.com/joho/godotenv"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"sync"
	"time"
)

var gcpToken = os.Getenv("GCP_TOKEN_PLACE_API")

type PlaceSearch struct {
	Results []struct {
		PlaceId string `json:"place_id"`
	} `json:"results"`
}

type OpeningHours struct {
	OpenNow     bool     `json:"open_now"`
	WeekdayText []string `json:"weekday_text"`
}

type Review struct {
	AuthorName string `json:"author_name"`
	Text       string `json:"text"`
}

type PlaceDetail struct {
	Result struct {
		Name                 string        `json:"name"`
		FormattedAddress     string        `json:"formatted_address"`
		FormattedPhoneNumber string        `json:"formatted_phone_number"`
		Website              string        `json:"website"`
		Rating               float64       `json:"rating"`
		BusinessStatus       string        `json:"business_status"`
		OpeningHours         *OpeningHours `json:"opening_hours"`
		Reviews              []Review      `json:"reviews"`
		Url                  string        `json:"url"`
		PriceLevel           int           `json:"price_level"`
	} `json:"result"`
}

func main() {
	err := godotenv.Load(".env")
	if err != nil {
		log.Fatalf("Erro ao carregar .env file")
	}

	if gcpToken == "" {
		log.Fatal("Please set GCP_TOKEN_PLACE_API environment variable")
	}

	http.HandleFunc("/search", searchHandler)

	log.Fatal(http.ListenAndServe(":8080", handlers.CORS(handlers.AllowedOrigins([]string{"*"}))(http.DefaultServeMux)))
}

func searchHandler(w http.ResponseWriter, r *http.Request) {
	client := &http.Client{Timeout: 10 * time.Second}

	searchStr := r.URL.Query().Get("query")

	placeSearch, err := searchPlace(client, searchStr)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	totalPlaces := len(placeSearch.Results)

	details := make([]*PlaceDetail, totalPlaces)
	var wg sync.WaitGroup

	for i, result := range placeSearch.Results {
		wg.Add(1)
		go func(i int, placeId string) {
			defer wg.Done()
			detail, err := getPlaceDetail(client, placeId)
			if err != nil {
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}
			details[i] = detail
		}(i, result.PlaceId)
	}

	wg.Wait()

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(details)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func searchPlace(client *http.Client, query string) (*PlaceSearch, error) {
	searchURL := fmt.Sprintf("https://maps.googleapis.com/maps/api/place/textsearch/json?query=%s&key=%s", url.QueryEscape(query), gcpToken)
	resp, err := client.Get(searchURL)
	if err != nil {
		return nil, err
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			log.Println(err)
		}
	}(resp.Body)

	respBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	placeSearch := PlaceSearch{}
	if err := json.Unmarshal(respBody, &placeSearch); err != nil {
		return nil, err
	}

	return &placeSearch, nil
}

func getPlaceDetail(client *http.Client, placeId string) (*PlaceDetail, error) {
	detailURL := fmt.Sprintf("https://maps.googleapis.com/maps/api/place/details/json?place_id=%s&fields=name,formatted_address,formatted_phone_number,website,rating,business_status,opening_hours,reviews,url,price_level&key=%s&language=pt-BR", placeId, gcpToken)
	resp, err := client.Get(detailURL)
	if err != nil {
		return nil, err
	}
	defer func(Body io.ReadCloser) {
		err := Body.Close()
		if err != nil {
			log.Println(err)
		}
	}(resp.Body)

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	placeDetail := PlaceDetail{}
	if err := json.Unmarshal(body, &placeDetail); err != nil {
		return nil, err
	}

	return &placeDetail, nil
}
