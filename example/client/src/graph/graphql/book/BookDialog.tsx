import { Modal, Form, Input, Collapse } from "antd";
import { useForm } from "antd/lib/form/Form";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useEffect } from "react";
import UUIDClass from "uuidjs";
import { author$, book$$, bookStore$, mutation$ } from "../../__generated_graphql_schema__/fetchers";
import { BookInput } from "../../__generated_graphql_schema__/inputs";
import { AuthorMultiSelect } from "../author/AuthorMultiSelect";
import { INFORMATION_CLASS, PSEUDO_CODE_CLASS } from "../Css";
import { BookStoreSelect } from "../store/BookStoreSelect";
import { useMutation } from "graphql-state";
import { useTypedStateManager } from "../../__generated_graphql_schema__";

const BOOK_EDIT_INFO =
    book$$
    .store(bookStore$.id)
    .authors(author$.id)
;

export const BookDialog: FC<{
    value?: ModelType<typeof BOOK_EDIT_INFO>,
    onClose: () => void
}> = memo(({value, onClose}) => {

    const [form] = useForm<BookInput>();

    useEffect(() => {
        form.setFieldsValue({
            id: value?.id ?? UUIDClass.generate(),
            name: value?.name ?? "",
            storeId: value?.store?.id,
            authorIds: value?.authors.map(author => author.id) ?? []
        })
    }, [form, value]);

    const stateManager = useTypedStateManager();
    
    const { mutate, loading } = useMutation(
        mutation$.mergeBook(
            BOOK_EDIT_INFO
        ),
        {
            onSuccess: data => {
                stateManager.save(BOOK_EDIT_INFO, data.mergeBook);
            }
        }
    );

    const onOk = useCallback(async () => {
        const input = await form.validateFields();
        await mutate({input});
        onClose();
    }, [form, mutate, onClose]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <Modal
        visible={true}
        title={`${value === undefined ? 'Create' : 'Edit'} Book`}
        onOk={onOk}
        onCancel={onCancel}
        width={1000}
        okButtonProps={{loading}}>
            <Form form={form} labelCol={{span: 8}} wrapperCol={{span: 16}}>
                <Form.Item name="id" hidden={true}/>
                <Form.Item label="Name" name="name">
                    <Input autoComplete="off"/>
                </Form.Item>
                {NAME_DESCRIPTION_ITEM}
                <Form.Item label="Store" name="storeId">
                    <BookStoreSelect optional={true}/>
                </Form.Item>
                {STORE_DESCRITPION_ITEM}
                <Form.Item label="Authors" name="authorIds">
                    <AuthorMultiSelect/>
                </Form.Item>
                {AUTHORS_DESCRIPTION_ITEM}
            </Form>
        </Modal>
    );
});


const FOR_NEW_NAME = `
for (const parameterizedBooks of 
    cache.get(Query.findBooks({...}))
) {
    // user optimizer or default optimizer
    const optimizer = assocaitionProperties["Query.findBooks"];

    const dependencies = optimizer.dependencies(
        parameterizedBooks.variables
    );

    if (dependencies === undefined || dependencies.has("name)) {
        const contains = optimizer.contains(this with newName);
        if (contains === true) {
            parameterizedBooks.addIfAbsent(this);
        } else (contains === false) {
            parameterizedBooks.removeIfExists(this);
        } else {
            cache.evict(parameterizedBooks);
            // Affected UI will reload data from server later
        }
    }

    for (const parameterizedBooks of 
        cache.get(BookStore::books({...}))
    ) {

        // user optimizer or default optimizer
        const optimizer = assocaitionProperties["BookStore::books"];

        const dependencies = optimizer.dependencies(
            parameterizedBooks.variables
        );
    
        if (dependencies === undefined || dependencies.has("name)) {
            cache.evict(parameterizedBooks);
            // Affected UI will reload data from server later
        }
    }

    for (const parameterizedBooks of 
        cache.get(Author::books({...}))
    ) {

        // user optimizer or default optimizer
        const optimizer = assocaitionProperties["Author.books"];

        const dependencies = optimizer.dependencies(
            parameterizedBooks.variables
        );
    
        if (dependencies === undefined || dependencies.has("name)) {
            cache.evict(parameterizedBooks);
            // Affected UI will reload data from server later
        }
    }
}
`;

const NAME_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'Book.name'">
                <div className={INFORMATION_CLASS}>
                    If you change this scalar field "BookStore.name" by any of the following ways
                    <ul>
                        <li>insert: undefined -&gt; newName</li>
                        <li>update: oldName -&gt; newName</li>
                    </ul>
                    (delete will be handed by other rules)
                    <pre className={PSEUDO_CODE_CLASS}>{FOR_NEW_NAME}</pre>
                </div>
            </Collapse.Panel>
        </Collapse>
    </Form.Item>
);

const FOR_OLD_STORE = `
if (oldStore !== undefined && cached(oldStore.books({...}))) {
    oldStore.books({...}).remove(this);
}`;

const FOR_NEW_STORE = `
if (newStore !== undefined && cached(newStore.books({...}))) {
    newStore.books({...}).add(this);
}`;

const STORE_DESCRITPION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'Book.store'">
                <div className={INFORMATION_CLASS}>
                    If you change this association "Book.store"
                    <ul>
                        <li>
                            For the old store, this action will be executed automatically
                            <pre className={PSEUDO_CODE_CLASS}>{FOR_OLD_STORE}</pre>
                        </li>
                        <li>
                            For the new store, this action will be executed automatically
                            <pre className={PSEUDO_CODE_CLASS}>{FOR_NEW_STORE}</pre>
                        </li>
                    </ul>
                </div>
            </Collapse.Panel>
        </Collapse>
    </Form.Item>
);

const FOR_REMOVED_AUTHOR = `

// Remove it from other similar assocaitons with parameters
for (const parameterizedAuthors of cache.get(this.authors({...}))) {
    parameterizedAuthors.remove(removedAuthor);
}

// Change opposite endpoint if it's cached
if (cached(removeAuthor.books({...}))) {
    removeAuthor.books({...}).remove(this);
}`;

const FOR_ADDED_AUTHOR = `

// Add it into similar assocaitons with parameters
for (const parameterizedAuthors of cache.get(this.authors({...}))) {

    // user optimizer or default optimizer
    const optimizer = assocaitionProperties["Book.author"];

    const contains = optimizer.contains(
        parameterizedAuthors.variables, 
        addedAuthor
    );
    if (contains === true) {
        parameterizedAuthors.insert(..., addedAuthor);
    } else if (contains === false) {
        // do nothing
    } else {
        cahce.evict(parameterizedAuthors);
        // Affected UI will reload data from server later
    }
}

// Change opposite endpoint if it's cached
if (cached(addedAuthor.books({...}))) {
    addedAuthor.books({...}).add(this);
}`;

const AUTHORS_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'Book.authors'">
                <div className={INFORMATION_CLASS}>
                    If you change this association "Book.authors"
                    <ul>
                        <li>
                            For each removed author, this action will be executed automatically
                            <pre className={PSEUDO_CODE_CLASS}>{FOR_REMOVED_AUTHOR}</pre>
                        </li>
                        <li>
                            For each added author, this action will be executed automatically
                            <pre className={PSEUDO_CODE_CLASS}>{FOR_ADDED_AUTHOR}</pre>
                        </li>
                    </ul>
                </div>
            </Collapse.Panel>
        </Collapse>
    </Form.Item>
);