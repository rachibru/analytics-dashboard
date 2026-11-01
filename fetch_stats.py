import os
import json
import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build
from google.analytics.data_v1beta import BetaAnalyticsDataClient
from google.analytics.data_v1beta.types import (
    RunReportRequest,
    DateRange,
    Metric,
    Dimension
)

sa_json_str = os.environ.get("GCP_SA_KEY")
if not sa_json_str:
    raise ValueError("La variabile GCP_SA_KEY non è impostata!")

credentials_info = json.loads(sa_json_str)
credentials = service_account.Credentials.from_service_account_info(
    credentials_info,
    scopes=[
        "https://www.googleapis.com/auth/analytics.readonly",
        "https://www.googleapis.com/auth/webmasters.readonly"
    ]
)

GA4_PROPERTY_ID = "IL_TUO_GA4_PROPERTY_ID"  # Inserisci le tue cifre
SITE_URL = "https://www.brunorachiele.it/"     # Il tuo URL Search Console

analytics_client = BetaAnalyticsDataClient(credentials=credentials)

# 1. KPI generali ultimi 30 giorni
request_kpi = RunReportRequest(
    property=f"properties/{GA4_PROPERTY_ID}",
    metrics=[Metric(name="activeUsers"), Metric(name="screenPageviews")],
    date_ranges=[DateRange(start_date="30daysAgo", end_date="today")]
)
response_kpi = analytics_client.run_report(request_kpi)

total_views = 0
if response_kpi.rows:
    total_views = int(response_kpi.rows[0].metric_values[1].value)

# 2. Andamento giornaliero (per il grafico)
request_chart = RunReportRequest(
    property=f"properties/{GA4_PROPERTY_ID}",
    dimensions=[Dimension(name="date")],
    metrics=[Metric(name="screenPageviews")],
    date_ranges=[DateRange(start_date="14daysAgo", end_date="today")]
)
response_chart = analytics_client.run_report(request_chart)

chart_labels = []
chart_data = []
if response_chart.rows:
    # Ordina per data
    sorted_rows = sorted(response_chart.rows, key=lambda x: x.dimension_values[0].value)
    for row in sorted_rows:
        raw_date = row.dimension_values[0].value # YYYYMMDD
        formatted_date = f"{raw_date[6:8]}/{raw_date[4:6]}"
        chart_labels.append(formatted_date)
        chart_data.append(int(row.metric_values[0].value))

# 3. Top Articoli
request_posts = RunReportRequest(
    property=f"properties/{GA4_PROPERTY_ID}",
    dimensions=[Dimension(name="pageTitle"), Dimension(name="fullPageUrl")],
    metrics=[Metric(name="screenPageviews"), Metric(name="userEngagementDuration")],
    date_ranges=[DateRange(start_date="30daysAgo", end_date="today")]
)
response_posts = analytics_client.run_report(request_posts)

top_posts = []
for row in response_posts.rows[:10]:
    title = row.dimension_values[0].value
    url = row.dimension_values[1].value
    views = int(row.metric_values[0].value)
    duration = float(row.metric_values[1].value)
    avg_time = f"{int(duration / max(views, 1))}s"
    top_posts.append({"title": title, "url": url, "views": views, "avg_time": avg_time})

# 4. Geolocalizzazione (Città)
request_geo = RunReportRequest(
    property=f"properties/{GA4_PROPERTY_ID}",
    dimensions=[Dimension(name="city"), Dimension(name="country")],
    metrics=[Metric(name="activeUsers")],
    date_ranges=[DateRange(start_date="30daysAgo", end_date="today")]
)
response_geo = analytics_client.run_report(request_geo)

geo_data = []
for row in response_geo.rows[:15]:
    city = row.dimension_values[0].value
    country = row.dimension_values[1].value
    users = int(row.metric_values[0].value)
    if city != "(not set)":
        geo_data.append({"city": city, "country": country, "users": users})

# 5. Search Console
search_console_service = build('searchconsole', 'v1', credentials=credentials)
end_date = datetime.date.today() - datetime.timedelta(days=2)
start_date = end_date - datetime.timedelta(days=30)

sc_request = {
    'startDate': start_date.strftime('%Y-%m-%d'),
    'endDate': end_date.strftime('%Y-%m-%d'),
    'dimensions': ['query'],
    'rowLimit': 10
}
sc_response = search_console_service.searchanalytics().query(siteUrl=SITE_URL, body=sc_request).execute()

search_queries = []
total_clicks = 0
total_impressions = 0
positions = []

if 'rows' in sc_response:
    for row in sc_response['rows']:
        query = row['keys'][0]
        clicks = int(row['clicks'])
        impressions = int(row['impressions'])
        position = round(row['position'], 1)
        
        total_clicks += clicks
        total_impressions += impressions
        positions.append(position)
        
        search_queries.append({
            "query": query,
            "clicks": clicks,
            "impressions": impressions,
            "position": position
        })

avg_position = round(sum(positions) / max(len(positions), 1), 1)

data = {
    "kpis": {
        "total_views": total_views,
        "total_clicks": total_clicks,
        "total_impressions": total_impressions,
        "avg_position": avg_position
    },
    "chart": {
        "labels": chart_labels,
        "data": chart_data
    },
