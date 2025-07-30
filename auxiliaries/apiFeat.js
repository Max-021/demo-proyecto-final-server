class ApiFeat {
    constructor(filteredModel, queryString) {
        this.filteredModel = filteredModel;
        this.queryString = queryString;
        this.filterObj = {};
    }
    filter() {
      const queryObj = { ...this.queryString };
      ["page", "sort", "limit", "fields"].forEach(f => delete queryObj[f]);

      const nested = {};
      Object.entries(queryObj).forEach(([rawKey, rawVal]) => {
        let val = rawVal;
        if (typeof val === "string" && val.includes(",")) {
          val = val.split(",").map(x => x.trim());
        }
        if (Array.isArray(val) && val.length === 0) return;

        if (
          rawVal != null &&
          typeof rawVal === "object" &&
          !Array.isArray(rawVal)
        ) {
          Object.entries(rawVal).forEach(([child, childVal]) => {
            const key = `${rawKey}.${child}`;
            nested[key] = Array.isArray(childVal)
              ? { $in: childVal }
              : childVal;
          });
          return;
        }

        const bracketMatch = rawKey.match(/^([^\[]+)\[([^\]]+)\]$/);
        if (bracketMatch) {
          const parent = bracketMatch[1];
          const child  = bracketMatch[2];
          const key = `${parent}.${child}`;
          nested[key] = Array.isArray(val) ? { $in: val } : val;
          return;
        }

        const parts = rawKey.split(".");
        if (parts.length > 1) {
          nested[rawKey] = Array.isArray(val) ? { $in: val } : val;
          return;
        }

        nested[rawKey] = Array.isArray(val) ? { $in: val } : val;
      });

      this.filterObj = nested;

      let queryStr = JSON.stringify(nested);
      queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, match => `$${match}`);
      this.filteredModel = this.filteredModel.find(JSON.parse(queryStr));

      return this;
    }
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(",").join(" ");
            this.filteredModel = this.filteredModel.sort(sortBy);
          } else {
            this.filteredModel = this.filteredModel.sort("-createdAt");
          }
        return this;
    }
    limitFields() {
            //field limiting
    if (this.queryString.fields) {
        const fields = this.queryString.fields.split(",").join(" ");
        this.filteredModel = this.filteredModel.select(fields);
      } else {
        this.filteredModel = this.filteredModel.select("-__v");
      }
      return this;
    }
    paginate() {
    //pagination
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.filteredModel = this.filteredModel.skip(skip).limit(limit);
    return this;
    }
}

module.exports = ApiFeat;


//filter viejo
/*
      //version vieja
      //building query for filtering
      // const queryObj = { ...this.queryString };
      // const excludedFields = ["page", "sort", "limit", "fields"];
      // excludedFields.forEach((el) => delete queryObj[el]);

      // let queryStr = JSON.stringify(queryObj);
      // queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, (match) => `$${match}`);

      // this.filteredModel = this.filteredModel.find(JSON.parse(queryStr));
      // return this;
*/