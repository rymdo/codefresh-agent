import * as crypto from "crypto";

export function getChecksum(input: any) {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(input))
    .digest("hex");
}
