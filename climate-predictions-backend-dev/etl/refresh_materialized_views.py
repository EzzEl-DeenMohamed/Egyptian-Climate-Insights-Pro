from sqlalchemy import text

from app.core.db import get_db_sync, init_db_sync, sync_engine_no_implicit_trans
from app.models.db.materialized_views import ClmValsPerGovOrCountryMonthMatView, ClmValsPerGovOrCountryYearMatView

if __name__ == "__main__":
    init_db_sync()

    mat_views = [
        ClmValsPerGovOrCountryMonthMatView,
        ClmValsPerGovOrCountryYearMatView
    ]

    with sync_engine_no_implicit_trans.connect() as conn:
        for mv in mat_views:
            # conn.execute(text(f"CALL refresh_continuous_aggregate('{mv.schema_name}.{mv.__tablename__}',"
            #                 f" window_start => NULL, window_end => NULL);"))
            conn.execute(text(f"REFRESH MATERIALIZED VIEW {mv.schema_name}.{mv.__tablename__}"))
