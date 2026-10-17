-- CreateTable
CREATE TABLE "tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token" VARCHAR NOT NULL,
    "issued_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "PK_tokens" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tokens_token_key" ON "tokens"("token");

-- CreateIndex
CREATE INDEX "tokens_user_id_idx" ON "tokens"("user_id");

-- AddForeignKey
ALTER TABLE "tokens" ADD CONSTRAINT "FK_tokens_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
