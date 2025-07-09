class ApiFeat {
    constructor(filteredModel, queryString) {
        this.filteredModel = filteredModel;
        this.queryString = queryString
    }
    filter() {
        //building query for filtering
        const queryObj = { ...this.queryString };
        const excludedFields = ["page", "sort", "limit", "fields"];
        excludedFields.forEach((el) => delete queryObj[el]);

        let queryStr = JSON.stringify(queryObj);
        queryStr = queryStr.replace(/\b(gte|gt|lt|lte)\b/g, (match) => `$${match}`);

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