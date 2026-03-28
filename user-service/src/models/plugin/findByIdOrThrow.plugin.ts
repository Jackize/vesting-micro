import { CustomError } from "@vestify/shared";
import { Model, Schema } from "mongoose";

export function findByIdOrThrow<T>(schema: Schema<T>): void {
  schema.statics.findByIdOrThrow = async function (
    this: Model<T>,
    id: string,
    errorMessage: string = "Resource not found",
  ): Promise<T> {
    const doc = await this.findById(id);
    if (!doc) {
      throw new CustomError(errorMessage, 404);
    }
    return doc;
  };
}
