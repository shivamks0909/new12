import { createHmac } from "crypto";

const PID = "TEST_PROJ_001";
const SUP = "TEST_SUP_001";
const RID = "RESPONDENT_001";
const TS = Math.floor(Date.now() / 1000).toString();
const SECRET = "router_secret_dev_only";

const message = `${PID}${SUP}${RID}${TS}`;
const h = createHmac("sha256", SECRET).update(message).digest("hex");

console.log(`http://127.0.0.1:3001/r/${PID}?sup=${SUP}&rid=${RID}`);
